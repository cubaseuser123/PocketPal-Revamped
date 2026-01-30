# Notification Agent System - Code Reference

Complete code reference for implementing the notification agent system.

---

## File Structure

```
apps/backend/
├── ai/                              # AI-related code (agents, RAG, etc.)
│   ├── agents/
│   │   └── notificationAgent.js     # Main agent logic
│   ├── data/
│   │   └── tips.json                # Fallback tips data
│   ├── services/
│   │   └── contextAggregator.js     # Data fetchers for tools
│   └── config/
│       └── aiConfig.js              # AI Gateway configuration
├── jobs/
│   └── cronJobs.js                  # Cron scheduler
├── services/
│   └── notificationService.js       # Push + in-app delivery
├── routes/
│   └── notificationRoutes.js        # API endpoints
└── server.js                        # Import cron + routes

apps/mobile/
├── hooks/
│   └── useNotifications.ts          # Fetch notifications
└── services/
    └── pushSetup.ts                 # Register push token
```

---

## Dependencies to Install

```bash
# In apps/backend
npm install ai zod node-cron
```

**package.json additions:**
```json
{
  "dependencies": {
    "ai": "^6.0.0",
    "node-cron": "^3.0.3",
    "zod": "^3.23.0"
  }
}
```

> **Note:** When using Vercel AI Gateway, you don't need provider-specific packages like `@ai-sdk/google`. The Gateway handles provider routing via model strings.

---

## Environment Variables

```env
# Add to apps/backend/.env

# Vercel AI Gateway (auto-provided when deployed on Vercel)
AI_GATEWAY_API_KEY=your_ai_gateway_api_key

# Or use direct Google API key (for local development)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

---

## Backend Code

### 1. ai/agents/notificationAgent.js

```javascript
import { generateText, tool } from "ai";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import {
  getWalletContext,
  getTransactionContext,
  getGoalContext,
  getSubscriptionContext,
} from "../services/contextAggregator.js";
import {
  sendPushNotification,
  saveInAppNotification,
  getLastNotification,
} from "../../services/notificationService.js";

const AGENT_PROMPT = `You are Pally's notification brain for a personal finance app called PocketPal.

Your job is to analyze the user's financial data and decide if they need a notification today.

## RULES
1. Maximum 1 push notification per day (unless urgent like budget exceeded by 50%+)
2. Celebrate wins - savings milestones, streaks, goals achieved
3. Warn about problems - overspending, goals at risk
4. Be specific with ₹ amounts and percentages
5. Push notifications: ≤100 characters
6. In-app notifications: ≤200 characters
7. Use 1-2 emojis maximum
8. Be friendly and encouraging, not judgmental

## NOTIFICATION TYPES
- alert: Budget exceeded, unusual spending (push)
- celebration: Goal milestone, streak achievement (push)
- insight: Spending patterns, tips (in-app)
- reminder: Upcoming subscription, goal deadline (push)

## RESPONSE FORMAT (JSON)
{
  "shouldNotify": boolean,
  "type": "alert" | "celebration" | "insight" | "reminder",
  "priority": "push" | "in-app",
  "title": "short title (≤30 chars)",
  "body": "notification message",
  "reason": "why you made this decision"
}

If nothing notable, respond with:
{ "shouldNotify": false, "reason": "explanation why no notification needed" }`;

export async function runNotificationAgent(userId) {
  try {
    // Check when last notification was sent
    const lastNotif = await getLastNotification(userId);
    const hoursSinceLastPush = lastNotif
      ? (Date.now() - new Date(lastNotif.createdAt).getTime()) / (1000 * 60 * 60)
      : 999;

    const result = await generateText({
      model: "google/gemini-2.0-flash",  // Vercel AI Gateway model string
      system: AGENT_PROMPT,
      tools: {
        getSpending: tool({
          description: "Get user's spending data for a period",
          inputSchema: z.object({
            days: z.number().default(7).describe("Number of days to analyze"),
          }),
          execute: async ({ days }) => {
            return await getTransactionContext(userId, { days });
          },
        }),
        getGoals: tool({
          description: "Get user's savings goals and their progress",
          inputSchema: z.object({}),
          execute: async () => {
            return await getGoalContext(userId);
          },
        }),
        getWallet: tool({
          description: "Get user's wallet balances",
          inputSchema: z.object({}),
          execute: async () => {
            return await getWalletContext(userId);
          },
        }),
        getSubscriptions: tool({
          description: "Get user's active subscriptions and upcoming renewals",
          inputSchema: z.object({}),
          execute: async () => {
            return await getSubscriptionContext(userId);
          },
        }),
      },
      maxSteps: 4,
      prompt: `Analyze user ${userId}. Last push notification was ${Math.round(hoursSinceLastPush)} hours ago. Decide if they need a notification today.`,
    });

    // Parse agent's decision
    let decision;
    try {
      // Extract JSON from response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : { shouldNotify: false };
    } catch (parseError) {
      console.error(`[Agent] Failed to parse response for ${userId}:`, result.text);
      return null;
    }

    if (!decision.shouldNotify) {
      console.log(`[Agent] AI decided no notification for ${userId}, fetching fallback tip...`);
      
      try {
        const tipsPath = path.join(process.cwd(), 'ai', 'data', 'tips.json');
        const tipsData = await fs.readFile(tipsPath, 'utf-8');
        const tips = JSON.parse(tipsData);
        
        if (tips.length > 0) {
           const randomTip = tips[Math.floor(Math.random() * tips.length)];
           decision = {
             shouldNotify: true,
             type: "insight", 
             priority: "in-app",
             title: randomTip.title,
             body: randomTip.body,
             reason: "Fallback tip used when no major notification needed"
           };
           console.log(`[Agent] Selected fallback tip: ${decision.title}`);
        } else {
           console.log(`[Agent] No tips found in tips.json`);
           return null;
        }
      } catch (err) {
        console.error(`[Agent] Error fetching tips: ${err.message}`);
        // Consider failing gracefully if tips fail
        return null;
      }
    }

    // Send notification based on priority
    if (decision.priority === "push") {
      const pushSent = await sendPushNotification(
        userId,
        decision.title,
        decision.body
      );
      if (!pushSent) {
        console.log(`[Agent] Push failed for ${userId}, saving as in-app`);
      }
    }

    // Always save in-app notification
    await saveInAppNotification(userId, {
      type: decision.type,
      title: decision.title,
      body: decision.body,
    });

    console.log(
      `[Agent] Notified user ${userId}: ${decision.type} - ${decision.title}`
    );
    return decision;
  } catch (error) {
    console.error(`[Agent] Error for user ${userId}:`, error);
    return null;
  }
}
```

---

### 2. ai/config/aiConfig.js

```javascript
import { createOpenAI } from "@ai-sdk/openai";

/**
 * AI Gateway Configuration
 * 
 * Uses Vercel AI Gateway for unified access to multiple AI providers.
 * In production (Vercel), the gateway is auto-configured.
 * In development, falls back to direct Google API key.
 */

// Create gateway-compatible provider
export const aiGateway = createOpenAI({
  baseURL: process.env.AI_GATEWAY_URL || "https://api.openai.com/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
  compatibility: "strict",
});

/**
 * Model configuration for different use cases
 */
export const models = {
  // Fast model for notifications, quick decisions
  fast: "google/gemini-2.0-flash",
  
  // Smart model for complex analysis, summaries
  smart: "google/gemini-2.0-flash",
  
  // Cheap model for simple tasks, fallbacks
  cheap: "google/gemini-2.0-flash",
};

/**
 * Get model string for Vercel AI Gateway
 * When using the gateway, models are specified as "provider/model-name"
 */
export function getModel(type = "fast") {
  return models[type] || models.fast;
}

/**
 * Common generation settings
 */
export const generationConfig = {
  temperature: 0.7,
  maxTokens: 1024,
  topP: 0.9,
};
```

---

### 3. ai/services/contextAggregator.js

```javascript
import { db } from "../../config/db.js";
import { 
  users, 
  wallets, 
  transactions, 
  goals, 
  subscriptions, 
  categories 
} from "../../drizzle/schema.js";
import { eq, desc, gte, and, sql } from "drizzle-orm";

/**
 * Get wallet balances for a user
 */
export async function getWalletContext(userId) {
  const userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  const primary = userWallets.find((w) => w.type === "primary");
  const savings = userWallets.find((w) => w.type === "savings");

  return {
    primaryBalance: primary ? parseFloat(primary.balance) : 0,
    savingsBalance: savings ? parseFloat(savings.balance) : 0,
    totalBalance:
      (primary ? parseFloat(primary.balance) : 0) +
      (savings ? parseFloat(savings.balance) : 0),
    ppiType: primary?.ppiType || "small_ppi",
    monthlyLoaded: primary ? parseFloat(primary.monthlyLoaded) : 0,
  };
}

/**
 * Get transaction context for analysis
 */
export async function getTransactionContext(userId, { days = 7 }) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const txns = await db
    .select({
      id: transactions.id,
      name: transactions.name,
      amount: transactions.amount,
      type: transactions.type,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(eq(transactions.userId, userId), gte(transactions.createdAt, startDate))
    )
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  // Calculate totals
  let totalSpent = 0;
  const byCategory = {};

  for (const txn of txns) {
    if (txn.type === "expense") {
      const amount = Math.abs(parseFloat(txn.amount));
      totalSpent += amount;
      const cat = txn.categoryName || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    }
  }

  // Find top category
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  return {
    period: `${days} days`,
    totalSpent: Math.round(totalSpent),
    avgPerDay: Math.round(totalSpent / days),
    transactionCount: txns.length,
    byCategory,
    topCategory: topCategory
      ? { name: topCategory[0], amount: Math.round(topCategory[1]) }
      : null,
    recentTransactions: txns.slice(0, 5).map((t) => ({
      name: t.name,
      amount: parseFloat(t.amount),
      category: t.categoryName,
    })),
  };
}

/**
 * Get goals context
 */
export async function getGoalContext(userId) {
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  const activeGoals = userGoals.filter((g) => !g.isCompleted);
  const featured = userGoals.find((g) => g.isFeatured) || activeGoals[0];

  // Check for goals that are behind schedule
  const now = new Date();
  const goalsAtRisk = activeGoals.filter((g) => {
    if (!g.targetDate) return false;
    const target = parseFloat(g.targetAmount);
    const current = parseFloat(g.currentAmount);
    const progress = current / target;
    const daysLeft = Math.ceil(
      (new Date(g.targetDate) - now) / (1000 * 60 * 60 * 24)
    );
    const targetProgress = 1 - daysLeft / 30; // Simple linear check
    return progress < targetProgress * 0.7;
  });

  return {
    totalGoals: userGoals.length,
    activeGoals: activeGoals.length,
    completedGoals: userGoals.filter((g) => g.isCompleted).length,
    featuredGoal: featured
      ? {
          name: featured.name,
          emoji: featured.emoji,
          progress: Math.round(
            (parseFloat(featured.currentAmount) /
              parseFloat(featured.targetAmount)) *
              100
          ),
          currentAmount: parseFloat(featured.currentAmount),
          targetAmount: parseFloat(featured.targetAmount),
          remaining:
            parseFloat(featured.targetAmount) -
            parseFloat(featured.currentAmount),
        }
      : null,
    goalsAtRisk: goalsAtRisk.map((g) => ({
      name: g.name,
      progress: Math.round(
        (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100
      ),
    })),
  };
}

/**
 * Get subscription context
 */
export async function getSubscriptionContext(userId) {
  const userSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))
    );

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingRenewals = userSubs.filter((s) => {
    const renewal = new Date(s.nextRenewal);
    return renewal >= now && renewal <= nextWeek;
  });

  const monthlyTotal = userSubs.reduce(
    (sum, s) => sum + parseFloat(s.price),
    0
  );

  return {
    activeCount: userSubs.length,
    monthlyTotal: Math.round(monthlyTotal),
    upcomingRenewals: upcomingRenewals.map((s) => ({
      name: s.name,
      price: parseFloat(s.price),
      renewalDate: s.nextRenewal,
      daysUntilRenewal: Math.ceil(
        (new Date(s.nextRenewal) - now) / (1000 * 60 * 60 * 24)
      ),
    })),
  };
}
```

---

### 4. services/notificationService.js

```javascript
import { db } from "../config/db.js";
import { users, notifications } from "../drizzle/schema.js";
import { eq, desc, and } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send push notification via Expo
 */
export async function sendPushNotification(userId, title, body) {
  try {
    // Get user's push token
    const [user] = await db
      .select({ expoPushToken: users.expoPushToken })
      .from(users)
      .where(eq(users.id, userId));

    if (!user?.expoPushToken) {
      console.log(`[Push] No push token for user ${userId}`);
      return false;
    }

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: user.expoPushToken,
        title,
        body,
        sound: "default",
        priority: "high",
        data: { userId, screen: "notifications" },
      }),
    });

    const result = await response.json();
    
    if (result.data?.[0]?.status === "error") {
      console.error(`[Push] Failed for ${userId}:`, result.data[0].message);
      return false;
    }

    console.log(`[Push] Sent to ${userId}: ${title}`);
    return true;
  } catch (error) {
    console.error(`[Push] Error for ${userId}:`, error);
    return false;
  }
}

/**
 * Save notification to database (in-app)
 */
export async function saveInAppNotification(userId, { type, title, body }) {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        body,
        read: false,
      })
      .returning();

    return notification;
  } catch (error) {
    console.error(`[Notification] Failed to save for ${userId}:`, error);
    return null;
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId) {
  return await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
}

/**
 * Get all notifications for a user
 */
export async function getAllNotifications(userId, limit = 50) {
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId))
    .returning();
  return updated;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

/**
 * Get the last notification sent to a user
 */
export async function getLastNotification(userId) {
  const [last] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(1);
  return last;
}
```

---

### 5. jobs/cronJobs.js

```javascript
import cron from "node-cron";
import { db } from "../config/db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { runNotificationAgent } from "../ai/agents/notificationAgent.js";

/**
 * Daily notification run at 8:00 AM IST (2:30 AM UTC)
 */
cron.schedule("30 2 * * *", async () => {
  console.log("[Cron] Starting daily notification run...");
  const startTime = Date.now();

  try {
    // Get all active users
    const activeUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.onboardingCompleted, true));

    console.log(`[Cron] Processing ${activeUsers.length} users...`);

    let processed = 0;
    let notified = 0;
    let errors = 0;

    for (const user of activeUsers) {
      try {
        const result = await runNotificationAgent(user.id);
        processed++;
        if (result?.shouldNotify) notified++;
      } catch (error) {
        errors++;
        console.error(`[Cron] Error processing user ${user.id}:`, error);
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[Cron] Done. Processed: ${processed}, Notified: ${notified}, Errors: ${errors}, Duration: ${duration}s`
    );
  } catch (error) {
    console.error("[Cron] Fatal error in daily run:", error);
  }
});

/**
 * Weekly recap on Sunday at 10:00 AM IST (4:30 AM UTC)
 */
cron.schedule("30 4 * * 0", async () => {
  console.log("[Cron] Starting weekly recap...");
  // TODO: Implement weekly summary agent
  console.log("[Cron] Weekly recap completed");
});

/**
 * Subscription reminder check - Daily at 9:00 AM IST (3:30 AM UTC)
 */
cron.schedule("30 3 * * *", async () => {
  console.log("[Cron] Checking subscription reminders...");
  // TODO: Check for subscriptions due in next 3 days
  console.log("[Cron] Subscription check completed");
});

console.log("[Cron] Scheduled jobs:");
console.log("  - Daily notifications: 8:00 AM IST");
console.log("  - Weekly recap: Sunday 10:00 AM IST");
console.log("  - Subscription reminders: 9:00 AM IST");
```

---

### 6. routes/notificationRoutes.js

```javascript
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService.js";

const router = express.Router();

/**
 * GET /api/v1/notifications
 * Get all notifications for the authenticated user
 */
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await getAllNotifications(req.user.id);
    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

/**
 * GET /api/v1/notifications/unread
 * Get only unread notifications
 */
router.get("/unread", protect, async (req, res) => {
  try {
    const notifications = await getUnreadNotifications(req.user.id);
    res.json({ notifications, count: notifications.length });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

/**
 * POST /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
router.post("/:id/read", protect, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
});

/**
 * POST /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.post("/read-all", protect, async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

export default router;
```

---

### 7. server.js modifications

Add these lines to your existing server.js:

```javascript
// Add at the top with other imports
import "./jobs/cronJobs.js"; // Start cron jobs
import notificationRoutes from "./routes/notificationRoutes.js";

// Add with other route registrations
app.use("/api/v1/notifications", notificationRoutes);
```

---

## Mobile Code

### 7. hooks/useNotifications.ts

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "./useUser";
import { auth } from "@repo/auth";

interface Notification {
  id: string;
  userId: string;
  type: "alert" | "insight" | "celebration" | "reminder";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const token = await auth.getToken();
      const response = await fetch(`${API_URL}/api/v1/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = await auth.getToken();
      const response = await fetch(
        `${API_URL}/api/v1/notifications/${notificationId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = await auth.getToken();
      const response = await fetch(
        `${API_URL}/api/v1/notifications/read-all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to mark all as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
```

---

### 8. services/pushSetup.ts

```typescript
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_URL } from "../hooks/useUser";
import { auth } from "@repo/auth";

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and save token to backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission denied");
    return null;
  }

  // Get the Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "your-expo-project-id", // Get from app.json
    });
    const token = tokenData.data;

    // Save token to backend
    const authToken = await auth.getToken();
    await fetch(`${API_URL}/api/v1/user/push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ expoPushToken: token }),
    });

    console.log("Push token registered:", token);
    return token;
  } catch (error) {
    console.error("Failed to register push token:", error);
    return null;
  }
}

/**
 * Handle notification received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification tap
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number) {
  if (Platform.OS === "ios") {
    await Notifications.setBadgeCountAsync(count);
  }
}
```

---

## Testing

### Test the agent locally

```javascript
// Create a test file: test-agent.js
import { runNotificationAgent } from "./agents/notificationAgent.js";

const TEST_USER_ID = "your-test-user-uuid";

async function test() {
  console.log("Testing notification agent...");
  const result = await runNotificationAgent(TEST_USER_ID);
  console.log("Result:", JSON.stringify(result, null, 2));
}

test();
```

Run with:
```bash
node test-agent.js
```

---

## Checklist

- [ ] Install dependencies: `npm install ai @ai-sdk/google zod node-cron`
- [ ] Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env`
- [ ] Create `agents/notificationAgent.js`
- [ ] Create `services/contextAggregator.js`
- [ ] Create `services/notificationService.js`
- [ ] Create `jobs/cronJobs.js`
- [ ] Create `routes/notificationRoutes.js`
- [ ] Update `server.js` to import cron and routes
- [ ] Create `hooks/useNotifications.ts` (mobile)
- [ ] Create `services/pushSetup.ts` (mobile)
- [ ] Test agent with a real user
- [ ] Verify cron jobs are running
