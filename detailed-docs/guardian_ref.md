# Spending Guardian System - Code Reference

Complete code reference for Plan B (Smart App Detection) and Plan C (Autonomous Mode). 

> **Prerequisite:** The existing Notification Agent system (`agents_ref.md`) must already be in place.  
> **Architecture overview:** See [spending_guardian_brainstorm.md](../brain/spending_guardian_brainstorm.md)

---

## New File Structure

```
apps/backend/
├── ai/
│   └── agents/
│       ├── notificationAgent.js        ← EXISTING (unchanged)
│       └── guardianAgent.js            ← NEW
├── routes/
│   ├── notificationRoutes.js           ← EXISTING (unchanged)
│   └── guardianRoutes.js               ← NEW
└── drizzle/
    └── schema.js                       ← MODIFY (add nudge type + 2 columns to users)

apps/mobile/
├── app/(protected)/
│   └── settings.tsx                    ← MODIFY (add Autonomous Mode toggle)
├── hooks/
│   └── useGuardian.ts                  ← NEW
└── services/
    ├── pushSetup.ts                    ← EXISTING (unchanged)
    ├── AppCategoryMap.json             ← NEW
    └── BackgroundMonitor.ts            ← NEW
```

---

## Dependencies to Install

```bash
# In apps/mobile
npx expo install expo-android-usagestats
npx expo install expo-task-manager
```

> **Note:** `expo-android-usagestats` provides the `UsageStatsManager` wrapper. `expo-task-manager` is likely already installed via `expo-background-fetch` — check `package.json` first.

---

## Android Permissions

Add to `apps/mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Plan B: detect foreground app -->
<uses-permission
  android:name="android.permission.PACKAGE_USAGE_STATS"
  tools:ignore="ProtectedPermissions" />
```

> **Note:** This permission cannot be granted via a normal prompt. The user must go to Android Settings → Apps → Special App Access → Usage Access and enable it for PocketPal.

---

## Database Changes

### 1. Add `nudge` to NotificationType enum

**File:** `apps/backend/drizzle/schema.js`

```diff
- export const notificationType = pgEnum("NotificationType", ['alert', 'insight', 'celebration', 'reminder']);
+ export const notificationType = pgEnum("NotificationType", ['alert', 'insight', 'celebration', 'reminder', 'nudge']);
```

### 2. Add two columns to the `users` table

**File:** `apps/backend/drizzle/schema.js`

```diff
  export const users = pgTable("users", {
    ...
    expoPushToken: varchar("expo_push_token", { length: 255 }),
+   autonomousModeEnabled: boolean("autonomous_mode_enabled").default(false).notNull(),
+   planBEnabled: boolean("plan_b_enabled").default(true).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
    ...
  });
```

After editing the schema, run a migration:

```bash
cd apps/backend
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

---

## Backend Code

### 1. `ai/agents/guardianAgent.js` (NEW)

```javascript
import { generateText, tool } from "ai";
import { z } from "zod";
import { db } from "../../config/db.js";
import { transactions, notifications, users, wallets } from "../../drizzle/schema.js";
import { eq, and, gte, desc, count, sql } from "drizzle-orm";
import {
  sendPushNotification,
  saveInAppNotification,
} from "../../services/notificationService.js";

const GUARDIAN_PROMPT = `You are PocketPal's Spending Guardian — a real-time financial watchdog.

You are triggered when a user opens or is about to pay on a spending app.
Your job is to decide if they need a nudge based on their recent spending in that category.

## RULES
1. If category budget is < 50% used — skip (no nudge needed)
2. If a nudge was sent < 2 hours ago — skip (cooldown)
3. If user has been nudged 3 times today — skip (daily cap)
4. Be friendly, not preachy. Gen-Z tone. Specific numbers only.
5. Push title: ≤ 50 chars. Body: ≤ 120 chars.
6. Include exact ₹ spend and order/transaction count.

## RESPONSE FORMAT (JSON)
{
  "shouldNudge": boolean,
  "title": "short push title",
  "body": "nudge message with ₹ amount and count",
  "reason": "why you decided this"
}

If skipping, respond with:
{ "shouldNudge": false, "reason": "explanation" }`;

/**
 * Run the Guardian Agent for a real-time app-detection event.
 * @param {string} userId
 * @param {string} detectedCategory - e.g. "Food Delivery", "Shopping"
 * @param {string} signal - "app_open" | "payment_app_switch" 
 */
export async function runGuardianAgent(userId, detectedCategory, signal = "app_open") {
  try {
    const result = await generateText({
      model: "google/gemini-2.0-flash",
      system: GUARDIAN_PROMPT,
      tools: {
        getCategorySpending: tool({
          description: "Get how much the user has spent in a specific category this week",
          inputSchema: z.object({
            category: z.string().describe("Spending category name"),
            days: z.number().default(7),
          }),
          execute: async ({ category, days }) => {
            return await getCategorySpendingContext(userId, category, days);
          },
        }),
        getNudgeHistory: tool({
          description: "Get the user's nudge history to check cooldown and daily cap",
          inputSchema: z.object({}),
          execute: async () => {
            return await getNudgeHistoryContext(userId);
          },
        }),
        getWalletBalance: tool({
          description: "Get the user's primary wallet balance",
          inputSchema: z.object({}),
          execute: async () => {
            const [wallet] = await db
              .select({ balance: wallets.balance })
              .from(wallets)
              .where(and(eq(wallets.userId, userId), eq(wallets.type, "primary")));
            return { balance: wallet ? parseFloat(wallet.balance) : 0 };
          },
        }),
      },
      maxSteps: 3,
      prompt: `User just triggered a "${signal}" event on category: "${detectedCategory}". 
               Should we send a spending nudge? Analyze their recent spending in this category first.`,
    });

    // Parse decision
    let decision;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : { shouldNudge: false };
    } catch {
      console.error(`[Guardian] Failed to parse response for ${userId}:`, result.text);
      return null;
    }

    if (!decision.shouldNudge) {
      console.log(`[Guardian] No nudge for ${userId}: ${decision.reason}`);
      return null;
    }

    // Send push notification
    await sendPushNotification(userId, decision.title, decision.body);

    // Save as in-app notification
    await saveInAppNotification(userId, {
      type: "nudge",
      title: decision.title,
      body: decision.body,
    });

    console.log(`[Guardian] Nudged ${userId}: ${decision.title}`);
    return decision;
  } catch (error) {
    console.error(`[Guardian] Error for ${userId}:`, error);
    return null;
  }
}

// ─── Tool Implementations ─────────────────────────────────────────────────────

async function getCategorySpendingContext(userId, category, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const txns = await db
    .select({
      amount: transactions.amount,
      name: transactions.name,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.createdAt, startDate)
      )
    )
    .orderBy(desc(transactions.createdAt));

  // Filter by category name match (loose — transaction name may contain category)
  // In practice, you'd join with categories table or use categoryId
  const categoryTxns = txns.filter((t) =>
    t.name.toLowerCase().includes(category.toLowerCase())
  );

  const totalSpent = categoryTxns.reduce(
    (sum, t) => sum + Math.abs(parseFloat(t.amount)),
    0
  );

  return {
    category,
    period: `${days} days`,
    totalSpent: Math.round(totalSpent),
    transactionCount: categoryTxns.length,
    recentTransactions: categoryTxns.slice(0, 3).map((t) => ({
      name: t.name,
      amount: Math.abs(parseFloat(t.amount)),
    })),
  };
}

async function getNudgeHistoryContext(userId) {
  const now = new Date();
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  // Get recent nudges from notifications table
  const recentNudges = await db
    .select({ createdAt: notifications.createdAt })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, "nudge"),
        gte(notifications.createdAt, twoDaysAgo)
      )
    )
    .orderBy(desc(notifications.createdAt));

  const lastNudge = recentNudges[0];
  const hoursSinceLastNudge = lastNudge
    ? (Date.now() - new Date(lastNudge.createdAt).getTime()) / (1000 * 60 * 60)
    : 999;

  const nudgesToday = recentNudges.filter(
    (n) => new Date(n.createdAt) >= startOfDay
  ).length;

  return {
    hoursSinceLastNudge: Math.round(hoursSinceLastNudge),
    nudgesToday,
    cooldownActive: hoursSinceLastNudge < 2,
    dailyCapReached: nudgesToday >= 3,
  };
}
```

---

### 2. `routes/guardianRoutes.js` (NEW)

```javascript
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { runGuardianAgent } from "../ai/agents/guardianAgent.js";
import { db } from "../config/db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

/**
 * POST /api/v1/guardian/check
 * Plan B — called when mobile detects a spending app in foreground
 * Body: { category: string, signal: "app_open" | "payment_app_switch" }
 */
router.post("/check", protect, async (req, res) => {
  try {
    const { category, signal = "app_open" } = req.body;

    if (!category) {
      return res.status(400).json({ message: "category is required" });
    }

    // Check if Plan B is enabled for this user (default: true)
    const [user] = await db
      .select({ planBEnabled: users.planBEnabled })
      .from(users)
      .where(eq(users.id, req.user.id));

    if (!user?.planBEnabled) {
      return res.json({ skipped: true, reason: "Plan B disabled by user" });
    }

    const result = await runGuardianAgent(req.user.id, category, signal);

    res.json({
      nudgeSent: !!result,
      nudge: result || null,
    });
  } catch (error) {
    console.error("[Guardian] /check error:", error);
    res.status(500).json({ message: "Guardian check failed", error: error.message });
  }
});

/**
 * POST /api/v1/guardian/intervene
 * Plan C — called when Autonomous Mode detects an ordering action on-screen
 * Body: { category: string, amount?: number }
 */
router.post("/intervene", protect, async (req, res) => {
  try {
    const { category, amount } = req.body;

    if (!category) {
      return res.status(400).json({ message: "category is required" });
    }

    // Check if Autonomous Mode is enabled
    const [user] = await db
      .select({ autonomousModeEnabled: users.autonomousModeEnabled })
      .from(users)
      .where(eq(users.id, req.user.id));

    if (!user?.autonomousModeEnabled) {
      return res.json({ skipped: true, reason: "Autonomous Mode not enabled" });
    }

    const result = await runGuardianAgent(req.user.id, category, "ordering_detected");

    res.json({
      nudgeSent: !!result,
      nudge: result || null,
    });
  } catch (error) {
    console.error("[Guardian] /intervene error:", error);
    res.status(500).json({ message: "Guardian intervene failed", error: error.message });
  }
});

/**
 * POST /api/v1/guardian/settings
 * Update guardian mode preferences
 * Body: { planBEnabled?: boolean, autonomousModeEnabled?: boolean }
 */
router.post("/settings", protect, async (req, res) => {
  try {
    const { planBEnabled, autonomousModeEnabled } = req.body;

    const updateData = {};
    if (typeof planBEnabled === "boolean") updateData.planBEnabled = planBEnabled;
    if (typeof autonomousModeEnabled === "boolean")
      updateData.autonomousModeEnabled = autonomousModeEnabled;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    await db.update(users).set(updateData).where(eq(users.id, req.user.id));

    res.json({ success: true, updated: updateData });
  } catch (error) {
    console.error("[Guardian] /settings error:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

export default router;
```

---

### 3. `server.js` — Add Guardian Routes

```diff
  import notificationRoutes from "./routes/notificationRoutes.js";
+ import guardianRoutes from "./routes/guardianRoutes.js";

  // ... existing route registrations ...
  app.use("/api/v1/notifications", notificationRoutes);
+ app.use("/api/v1/guardian", guardianRoutes);
```

---

## Mobile Code

### 4. `services/AppCategoryMap.json` (NEW)

Curated on-device mapping from Play Store package names → PocketPal spending categories. Never sent to the backend.

```json
{
  "packageCategories": {
    "com.application.zomato": "Food Delivery",
    "in.swiggy.android": "Food Delivery",
    "com.ubercab.eats": "Food Delivery",
    "com.dunzo.user": "Food Delivery",
    "com.magicpin.base": "Food Delivery",
    "in.amazon.mShop.android.shopping": "Shopping",
    "com.flipkart.android": "Shopping",
    "com.myntra.android": "Shopping",
    "com.meesho.supply": "Shopping",
    "com.ajio.consumer": "Shopping",
    "com.nykaa.app.nykaaapp": "Shopping",
    "in.zepto.app": "Quick Commerce",
    "com.grofers.customerapp": "Quick Commerce",
    "in.bigbasket.app": "Quick Commerce",
    "com.bookmyshow.android": "Entertainment",
    "com.pvr.pvrcinemax": "Entertainment",
    "com.netflix.mediaclient": "Entertainment",
    "in.startv.hotstar": "Entertainment",
    "com.primevideo.android": "Entertainment",
    "com.uber.rider": "Transport",
    "com.olacabs.customer": "Transport",
    "com.riderunner": "Transport",
    "com.makemytrip": "Travel",
    "com.irctc.ticketbooking": "Travel",
    "com.cleartrip.android": "Travel",
    "com.goibibo": "Travel"
  },
  "paymentApps": [
    "com.google.android.apps.nbu.paisa.user",
    "net.one97.paytm",
    "com.phonepe.app",
    "com.csam.icici.bank.imobile",
    "com.axis.mobile",
    "com.dreamplug.androidapp",
    "com.freecharge.android",
    "in.amazon.mShop.android.shopping"
  ],
  "playStoreCategoryMap": {
    "FOOD_AND_DRINK": "Food Delivery",
    "SHOPPING": "Shopping",
    "TRAVEL_AND_LOCAL": "Transport",
    "ENTERTAINMENT": "Entertainment",
    "GAME": "Gaming"
  }
}
```

---

### 5. `services/BackgroundMonitor.ts` (NEW)

```typescript
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { Platform } from "react-native";
import { storage } from "@repo/auth";
import { API_URL } from "../hooks/useUser";
import categoryMap from "./AppCategoryMap.json";

const GUARDIAN_TASK = "GUARDIAN_BACKGROUND_TASK";
const POLL_INTERVAL_SECONDS = 30;

// Track last detected app to avoid duplicate events
let lastDetectedPackage: string | null = null;
let lastEventTime: number = 0;
const DEBOUNCE_MS = 60_000; // Min 1 min between events for same app

// ─── Task Definition ──────────────────────────────────────────────────────────

TaskManager.defineTask(GUARDIAN_TASK, async () => {
  try {
    if (Platform.OS !== "android") {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const event = await detectSpendingEvent();

    if (event) {
      await reportToGuardian(event.category, event.signal);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[Guardian] Background task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Core Detection Logic ─────────────────────────────────────────────────────

async function detectSpendingEvent(): Promise<{
  category: string;
  signal: "app_open" | "payment_app_switch";
} | null> {
  try {
    // Dynamically import to avoid issues if module missing
    const UsageStats = await import("expo-android-usagestats").catch(() => null);
    if (!UsageStats) return null;

    const now = Date.now();
    const oneMinuteAgo = now - 60_000;

    // Get recent usage events
    const events = await UsageStats.getUsageEvents(oneMinuteAgo, now);

    if (!events || events.length === 0) return null;

    // Find the most recent foreground app
    const foregroundEvents = events.filter(
      (e: any) => e.eventType === 1 // MOVE_TO_FOREGROUND
    );

    if (foregroundEvents.length === 0) return null;

    const latestEvent = foregroundEvents[foregroundEvents.length - 1];
    const packageName: string = latestEvent.packageName;

    // Skip system apps and PocketPal itself
    if (
      packageName === "com.android.launcher" ||
      packageName === "com.pocketpal.app" ||
      packageName.startsWith("com.android.") ||
      packageName.startsWith("com.google.android.gms")
    ) {
      return null;
    }

    // Debounce — don't re-report the same app within 1 minute
    if (packageName === lastDetectedPackage && now - lastEventTime < DEBOUNCE_MS) {
      return null;
    }

    // ── Layer 1: Check curated list ──────────────────────────────────────────
    const curatedCategory =
      (categoryMap.packageCategories as Record<string, string>)[packageName];

    if (curatedCategory) {
      lastDetectedPackage = packageName;
      lastEventTime = now;
      return { category: curatedCategory, signal: "app_open" };
    }

    // ── Layer 2: Check payment app switch ────────────────────────────────────
    // Was the previous foreground app a spending app, and this is a payment app?
    if (
      categoryMap.paymentApps.includes(packageName) &&
      lastDetectedPackage &&
      (categoryMap.packageCategories as Record<string, string>)[lastDetectedPackage]
    ) {
      const spendingCategory =
        (categoryMap.packageCategories as Record<string, string>)[lastDetectedPackage];
      lastDetectedPackage = packageName;
      lastEventTime = now;
      return { category: spendingCategory, signal: "payment_app_switch" };
    }

    // ── Layer 3: Check PlayStore category via PackageManager ─────────────────
    const playCategory = await getPlayStoreCategory(packageName, UsageStats);
    if (playCategory) {
      lastDetectedPackage = packageName;
      lastEventTime = now;
      return { category: playCategory, signal: "app_open" };
    }

    return null;
  } catch (error) {
    console.error("[Guardian] Detection error:", error);
    return null;
  }
}

async function getPlayStoreCategory(
  packageName: string,
  UsageStats: any
): Promise<string | null> {
  try {
    // Use Android PackageManager to read the app's install source category
    // expo-android-usagestats exposes getInstalledApps with category info
    const installedApps = await UsageStats.getInstalledApps?.();
    if (!installedApps) return null;

    const app = installedApps.find((a: any) => a.packageName === packageName);
    if (!app?.category) return null;

    // Map Android app category int to Play Store category string
    // https://developer.android.com/reference/android/content/pm/ApplicationInfo#category
    const ANDROID_CATEGORY_MAP: Record<number, string> = {
      0: "GAME", // CATEGORY_GAME
      1: "AUDIO", // CATEGORY_AUDIO
      2: "VIDEO", // CATEGORY_VIDEO
      3: "IMAGE", // CATEGORY_IMAGE
      4: "SOCIAL", // CATEGORY_SOCIAL
      5: "NEWS", // CATEGORY_NEWS
      6: "MAPS", // CATEGORY_MAPS
      7: "PRODUCTIVITY", // CATEGORY_PRODUCTIVITY
      8: "FOOD_AND_DRINK", // CATEGORY_FOOD_AND_DRINK
      9: "SHOPPING", // CATEGORY_SHOPPING (API 31+)
      10: "TRAVEL_AND_LOCAL",
    };

    const categoryString = ANDROID_CATEGORY_MAP[app.category];
    if (!categoryString) return null;

    return (categoryMap.playStoreCategoryMap as Record<string, string>)[categoryString] || null;
  } catch {
    return null;
  }
}

// ─── Backend Reporting ────────────────────────────────────────────────────────

async function reportToGuardian(
  category: string,
  signal: "app_open" | "payment_app_switch"
) {
  try {
    const token = await storage.get("access_token");
    if (!token) return;

    await fetch(`${API_URL}/api/v1/guardian/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category, signal }),
    });

    console.log(`[Guardian] Reported: ${category} (${signal})`);
  } catch (error) {
    console.error("[Guardian] Failed to report to backend:", error);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start the background monitoring task.
 * Call this when Plan B is enabled in settings.
 */
export async function startGuardianMonitor() {
  if (Platform.OS !== "android") {
    console.log("[Guardian] Background monitoring only on Android");
    return false;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GUARDIAN_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(GUARDIAN_TASK, {
        minimumInterval: POLL_INTERVAL_SECONDS,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
    console.log("[Guardian] Monitor started");
    return true;
  } catch (error) {
    console.error("[Guardian] Failed to start monitor:", error);
    return false;
  }
}

/**
 * Stop the background monitoring task.
 * Call this when Plan B is disabled in settings.
 */
export async function stopGuardianMonitor() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GUARDIAN_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(GUARDIAN_TASK);
    }
    console.log("[Guardian] Monitor stopped");
  } catch (error) {
    console.error("[Guardian] Failed to stop monitor:", error);
  }
}

export async function isGuardianMonitorActive() {
  return TaskManager.isTaskRegisteredAsync(GUARDIAN_TASK);
}
```

---

### 6. `hooks/useGuardian.ts` (NEW)

```typescript
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "./useUser";
import { storage } from "@repo/auth";
import {
  startGuardianMonitor,
  stopGuardianMonitor,
  isGuardianMonitorActive,
} from "../services/BackgroundMonitor";

export function useGuardian() {
  const queryClient = useQueryClient();
  const [isMonitorActive, setIsMonitorActive] = useState(false);

  // Check if monitor is running on mount
  useEffect(() => {
    isGuardianMonitorActive().then(setIsMonitorActive);
  }, []);

  const updateSettingsMutation = useMutation({
    mutationFn: async ({
      planBEnabled,
      autonomousModeEnabled,
    }: {
      planBEnabled?: boolean;
      autonomousModeEnabled?: boolean;
    }) => {
      const token = await storage.get("access_token");
      const response = await fetch(`${API_URL}/api/v1/guardian/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planBEnabled, autonomousModeEnabled }),
      });
      if (!response.ok) throw new Error("Failed to update guardian settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const enablePlanB = async () => {
    const started = await startGuardianMonitor();
    if (started) {
      setIsMonitorActive(true);
      await updateSettingsMutation.mutateAsync({ planBEnabled: true });
    }
    return started;
  };

  const disablePlanB = async () => {
    await stopGuardianMonitor();
    setIsMonitorActive(false);
    await updateSettingsMutation.mutateAsync({ planBEnabled: false });
  };

  const enableAutonomousMode = async () => {
    await updateSettingsMutation.mutateAsync({ autonomousModeEnabled: true });
  };

  const disableAutonomousMode = async () => {
    await updateSettingsMutation.mutateAsync({ autonomousModeEnabled: false });
  };

  return {
    isMonitorActive,
    enablePlanB,
    disablePlanB,
    enableAutonomousMode,
    disableAutonomousMode,
    isUpdating: updateSettingsMutation.isPending,
  };
}
```

---

### 7. `settings.tsx` — Add Guardian Section (MODIFY)

Add these imports at the top of `settings.tsx`:

```diff
+ import { useGuardian } from "../../hooks/useGuardian";
+ import { Platform } from "react-native";
```

Add state in `SettingsScreen`:

```diff
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

+ const {
+   isMonitorActive,
+   enablePlanB,
+   disablePlanB,
+   enableAutonomousMode,
+   disableAutonomousMode,
+   isUpdating: guardianUpdating,
+ } = useGuardian();
```

Add a new section to the `sections` array (after "Preferences", before "Support"):

```diff
    {
      title: "Preferences",
      items: [
        { id: "language", icon: "language", label: "Language", type: "navigate", badge: "English" },
        { id: "darkmode", icon: "dark-mode", label: "Dark Mode", type: "toggle", value: darkMode },
        { id: "autosave", icon: "savings", label: "Auto-Save Roundups", type: "toggle", value: autoSaveEnabled },
      ],
    },
+   // Only show Guardian section on Android
+   ...(Platform.OS === "android" ? [{
+     title: "Spending Guardian",
+     items: [
+       {
+         id: "planB",
+         icon: "shield" as const,
+         label: "Smart Spending Alerts",
+         type: "toggle" as const,
+         value: isMonitorActive,
+         badge: "Plan B",
+         badgeColor: "#10B981",
+       },
+       {
+         id: "autonomousMode",
+         icon: "visibility" as const,
+         label: "Autonomous Mode",
+         type: "toggle" as const,
+         value: user?.autonomousModeEnabled || false,
+         badge: "Plan C",
+         badgeColor: "#818CF8",
+       },
+     ],
+   }] : []),
    {
      title: "Support",
```

Add cases in `handleItemPress`:

```diff
      case 'autosave': setAutoSaveEnabled(!autoSaveEnabled); break;
      case 'darkmode': setDarkMode(!darkMode); break;
+     case 'planB':
+       if (isMonitorActive) {
+         disablePlanB();
+       } else {
+         // Show disclosure before enabling
+         showAlert(
+           "🛡️ Smart Spending Alerts",
+           "PocketPal will detect when you open spending apps (like Zomato or Amazon) and remind you of your budget.\n\nThis requires Usage Access permission.",
+           [
+             { text: "Cancel", style: "cancel" },
+             { text: "Enable", onPress: () => enablePlanB() },
+           ]
+         );
+       }
+       break;
+     case 'autonomousMode':
+       if (user?.autonomousModeEnabled) {
+         disableAutonomousMode();
+       } else {
+         showAlert(
+           "⚡ Autonomous Mode",
+           "PocketPal will watch for ordering actions on spending apps and intervene before you pay.\n\nThis requires Accessibility Service permission.",
+           [
+             { text: "Cancel", style: "cancel" },
+             { text: "Enable", onPress: () => enableAutonomousMode() },
+           ]
+         );
+       }
+       break;
```

---

## API Reference Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/guardian/check` | ✅ | Plan B — report app open / payment switch |
| `POST` | `/api/v1/guardian/intervene` | ✅ | Plan C — report ordering action detected |
| `POST` | `/api/v1/guardian/settings` | ✅ | Toggle Plan B / Autonomous Mode |

**Request body for `/check` and `/intervene`:**
```json
{
  "category": "Food Delivery",
  "signal": "app_open" | "payment_app_switch" | "ordering_detected",
  "amount": 450
}
```

---

## Google Play Compliance Notes

When submitting to Play Store with `PACKAGE_USAGE_STATS`:

1. **Permission declaration form** — In Play Console → App Content → Permissions, declare: *"We use Usage Stats to detect when users open spending apps and provide real-time budget awareness as part of our core financial management purpose."*
2. **Privacy policy** — Add a section noting app usage data is processed on-device, only spending category (never app names) are sent to servers.
3. **Opt-in disclosure** — The `showAlert` before enabling Plan B in settings satisfies Google's prominent disclosure requirement.
4. **Data minimization** — `BackgroundMonitor.ts` maps package → category on-device. Only the category string reaches the backend. ✅
