# Pally AI Chatbot - Code Reference

Complete code reference for implementing Pally AI chatbot with **tool calling only** (no RAG).

> 📖 **High-level plan:** [implementation_plan.md](./implementation_plan.md)  
> 📐 **Design principles & tone:** [pally_ai_implementation.md](./pally_ai_implementation.md)

---

## File Structure

```
apps/backend/
├── ai/
│   ├── config/
│   │   └── aiConfig.js              # AI model configuration (already exists)
│   └── services/
│       └── chatTools.js             # [NEW] 15 tool implementations for Pally
├── controllers/
│   └── chatController.js            # [NEW] Stream handler + tool registration
├── routes/
│   └── chatRoutes.js                # [NEW] Chat endpoint
└── server.js                        # [MODIFY] Register chat route

apps/mobile/
└── hooks/
    └── usePallyChat.ts              # [NEW] Streaming chat hook
```

---

## Dependencies to Install

```bash
# In apps/backend
pnpm add @ai-sdk/gateway
```

**package.json additions:**
```json
{
  "dependencies": {
    "@ai-sdk/gateway": "^1.0.0"
  }
}
```

> **Note:** `ai` (v6) and `zod` (v4) are already installed. `@ai-sdk/gateway` provides the unified gateway for routing to any model (Mistral, Google, Anthropic, etc.).

---

## Environment Variables

```env
# Add to apps/backend/.env

# Vercel AI Gateway (auto-provided on Vercel deployments)
AI_GATEWAY_API_KEY=your_ai_gateway_api_key
```

> **Note:** On Vercel, the gateway key is auto-provisioned. For local dev, set `AI_GATEWAY_API_KEY` in your `.env`.

---

## Backend Code

### 1. ai/services/chatTools.js

All 15 tool implementations that query the database via Drizzle ORM.

```javascript
import { db } from "../../config/db.js";
import {
  users,
  wallets,
  transactions,
  goals,
  subscriptions,
  categories,
  quests,
  questAssignments,
  userBadges,
  friends,
} from "../../drizzle/schema.js";
import { eq, desc, gte, and, or, sql, asc } from "drizzle-orm";

// ============================================================
// 💰 FINANCIAL TOOLS (6)
// ============================================================

/**
 * Tool 1: getWalletBalance
 * Returns primary + savings wallet balances
 */
export async function getWalletBalance(userId) {
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
 * Tool 2: getRecentTransactions
 * Returns recent transactions with optional filters
 */
export async function getRecentTransactions(
  userId,
  { limit = 10, days = 7, category = null }
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const conditions = [
    eq(transactions.userId, userId),
    gte(transactions.createdAt, startDate),
  ];

  const txns = await db
    .select({
      id: transactions.id,
      name: transactions.name,
      emoji: transactions.emoji,
      amount: transactions.amount,
      type: transactions.type,
      note: transactions.note,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);

  // If category filter was provided, filter in-memory
  const filtered = category
    ? txns.filter(
        (t) => t.categoryName?.toLowerCase() === category.toLowerCase()
      )
    : txns;

  return {
    transactions: filtered.map((t) => ({
      name: t.name,
      emoji: t.emoji,
      amount: parseFloat(t.amount),
      type: t.type,
      category: t.categoryName || "Other",
      categoryEmoji: t.categoryEmoji || "💰",
      note: t.note,
      date: t.createdAt,
    })),
    count: filtered.length,
    period: `${days} days`,
  };
}

/**
 * Tool 3: getSpendingSummary
 * Returns total spending for a period
 */
export async function getSpendingSummary(userId, period) {
  const days = period === "week" ? 7 : period === "month" ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const txns = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.createdAt, startDate)
      )
    );

  let totalSpent = 0;
  let totalIncome = 0;

  for (const txn of txns) {
    const amount = Math.abs(parseFloat(txn.amount));
    if (txn.type === "expense") totalSpent += amount;
    if (txn.type === "income") totalIncome += amount;
  }

  return {
    period: `${days} days`,
    totalSpent: Math.round(totalSpent),
    totalIncome: Math.round(totalIncome),
    netFlow: Math.round(totalIncome - totalSpent),
    avgPerDay: Math.round(totalSpent / days),
    transactionCount: txns.length,
  };
}

/**
 * Tool 4: getCategoryBreakdown
 * Returns spending breakdown by category
 */
export async function getCategoryBreakdown(userId, period) {
  const days = period === "week" ? 7 : period === "month" ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const txns = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.createdAt, startDate)
      )
    );

  const byCategory = {};
  let totalSpent = 0;

  for (const txn of txns) {
    const amount = Math.abs(parseFloat(txn.amount));
    totalSpent += amount;
    const cat = txn.categoryName || "Other";
    const emoji = txn.categoryEmoji || "💰";

    if (!byCategory[cat]) {
      byCategory[cat] = { amount: 0, emoji, count: 0 };
    }
    byCategory[cat].amount += amount;
    byCategory[cat].count += 1;
  }

  // Sort by amount descending and calculate percentages
  const breakdown = Object.entries(byCategory)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([name, data]) => ({
      category: name,
      emoji: data.emoji,
      amount: Math.round(data.amount),
      percentage: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0,
      transactionCount: data.count,
    }));

  return {
    period: `${days} days`,
    totalSpent: Math.round(totalSpent),
    breakdown,
    topCategory: breakdown[0] || null,
  };
}

/**
 * Tool 5: getGoals
 * Returns user's savings goals and progress
 */
export async function getGoals(userId) {
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  const activeGoals = userGoals.filter((g) => !g.isCompleted);
  const completedGoals = userGoals.filter((g) => g.isCompleted);
  const featured = userGoals.find((g) => g.isFeatured) || activeGoals[0];

  return {
    totalGoals: userGoals.length,
    activeCount: activeGoals.length,
    completedCount: completedGoals.length,
    featuredGoal: featured
      ? {
          name: featured.name,
          emoji: featured.emoji,
          color: featured.color,
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
          targetDate: featured.targetDate,
        }
      : null,
    goals: activeGoals.map((g) => ({
      name: g.name,
      emoji: g.emoji,
      progress: Math.round(
        (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100
      ),
      currentAmount: parseFloat(g.currentAmount),
      targetAmount: parseFloat(g.targetAmount),
    })),
  };
}

/**
 * Tool 6: getSubscriptions
 * Returns active subscriptions and upcoming renewals
 */
export async function getSubscriptions(userId) {
  const userSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
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
    subscriptions: userSubs.map((s) => ({
      name: s.name,
      price: parseFloat(s.price),
      category: s.category,
      renewalCycle: s.renewalCycle,
      nextRenewal: s.nextRenewal,
    })),
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

// ============================================================
// 📊 ANALYTICS TOOLS (4)
// ============================================================

/**
 * Tool 7: explainChart
 * Generates insights for a specific chart type and period
 */
export async function explainChart(userId, { period, chartType }) {
  const days = period === "week" ? 7 : period === "month" ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const txns = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.createdAt, startDate)
      )
    )
    .orderBy(asc(transactions.createdAt));

  // Build daily spending map
  const dailySpending = {};
  const byCategory = {};
  let totalSpent = 0;

  for (const txn of txns) {
    if (txn.type !== "expense") continue;
    const amount = Math.abs(parseFloat(txn.amount));
    totalSpent += amount;

    const day = new Date(txn.createdAt).toISOString().split("T")[0];
    dailySpending[day] = (dailySpending[day] || 0) + amount;

    const cat = txn.categoryName || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + amount;
  }

  // Find peak and lowest days
  const dailyEntries = Object.entries(dailySpending).sort(
    (a, b) => b[1] - a[1]
  );
  const peakDay = dailyEntries[0];
  const lowestDay = dailyEntries[dailyEntries.length - 1];

  // Top categories
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount: Math.round(amount) }));

  return {
    chartType,
    period: `${days} days`,
    totalSpent: Math.round(totalSpent),
    avgPerDay: Math.round(totalSpent / days),
    peakDay: peakDay
      ? { date: peakDay[0], amount: Math.round(peakDay[1]) }
      : null,
    lowestDay: lowestDay
      ? { date: lowestDay[0], amount: Math.round(lowestDay[1]) }
      : null,
    topCategories,
    daysWithSpending: Object.keys(dailySpending).length,
    totalDays: days,
  };
}

/**
 * Tool 8: compareSpending
 * Compares spending between two periods
 */
export async function compareSpending(userId, { period1, period2 }) {
  async function getPeriodTotal(period) {
    const days = period === "week" ? 7 : period === "month" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const txns = await db
      .select({ amount: transactions.amount, type: transactions.type })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          gte(transactions.createdAt, startDate)
        )
      );

    const total = txns.reduce(
      (sum, t) => sum + Math.abs(parseFloat(t.amount)),
      0
    );
    return { period, days, total: Math.round(total), count: txns.length };
  }

  const [data1, data2] = await Promise.all([
    getPeriodTotal(period1),
    getPeriodTotal(period2),
  ]);

  const difference = data1.total - data2.total;
  const percentChange =
    data2.total > 0 ? Math.round((difference / data2.total) * 100) : 0;

  return {
    period1: data1,
    period2: data2,
    difference: Math.abs(difference),
    direction: difference > 0 ? "more" : difference < 0 ? "less" : "same",
    percentChange,
  };
}

/**
 * Tool 9: getTopSpendingDays
 * Returns the highest spending days in a period
 */
export async function getTopSpendingDays(userId, { days = 30 }) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const txns = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.createdAt, startDate)
      )
    );

  const byDay = {};
  for (const txn of txns) {
    const day = new Date(txn.createdAt).toISOString().split("T")[0];
    const dayName = new Date(txn.createdAt).toLocaleDateString("en-IN", {
      weekday: "long",
    });
    if (!byDay[day]) {
      byDay[day] = { date: day, dayName, total: 0, count: 0 };
    }
    byDay[day].total += Math.abs(parseFloat(txn.amount));
    byDay[day].count += 1;
  }

  const ranked = Object.values(byDay)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((d, i) => ({
      rank: i + 1,
      date: d.date,
      dayName: d.dayName,
      total: Math.round(d.total),
      transactionCount: d.count,
    }));

  return {
    period: `${days} days`,
    topDays: ranked,
  };
}

/**
 * Tool 10: findLargeTransactions
 * Returns transactions above a certain threshold
 */
export async function findLargeTransactions(
  userId,
  { threshold = 500, days = 30 }
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const txns = await db
    .select({
      name: transactions.name,
      emoji: transactions.emoji,
      amount: transactions.amount,
      type: transactions.type,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.createdAt, startDate)
      )
    )
    .orderBy(desc(transactions.createdAt));

  // Filter in-memory for large transactions (Drizzle numeric comparison)
  const large = txns
    .filter((t) => Math.abs(parseFloat(t.amount)) >= threshold)
    .map((t) => ({
      name: t.name,
      emoji: t.emoji,
      amount: Math.abs(parseFloat(t.amount)),
      category: t.categoryName || "Other",
      date: t.createdAt,
    }));

  return {
    threshold,
    period: `${days} days`,
    count: large.length,
    transactions: large,
    totalLargeSpending: Math.round(
      large.reduce((sum, t) => sum + t.amount, 0)
    ),
  };
}

// ============================================================
// 🎮 GAMIFICATION TOOLS (3)
// ============================================================

/**
 * Tool 11: getStreakStatus
 * Returns the user's current streak and level info
 */
export async function getStreakStatus(userId) {
  const [user] = await db
    .select({
      level: users.level,
      coins: users.coins,
      totalGoalsCompleted: users.totalGoalsCompleted,
      lastSpinDate: users.lastSpinDate,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return { error: "User not found" };

  // Calculate a basic streak from consecutive daily transactions
  const recentTxns = await db
    .select({ createdAt: transactions.createdAt })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(60);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    const hasActivity = recentTxns.some((t) => {
      const txnDate = new Date(t.createdAt).toISOString().split("T")[0];
      return txnDate === dateStr;
    });

    if (hasActivity) {
      streak++;
    } else if (i > 0) {
      // Allow today to not have activity yet
      break;
    }
  }

  return {
    level: user.level,
    coins: user.coins,
    currentStreak: streak,
    totalGoalsCompleted: user.totalGoalsCompleted,
    canSpinWheel: !user.lastSpinDate || 
      new Date(user.lastSpinDate).toISOString().split("T")[0] !== 
      new Date().toISOString().split("T")[0],
  };
}

/**
 * Tool 12: getActiveQuests
 * Returns the user's currently assigned active quests with progress
 */
export async function getActiveQuests(userId) {
  const assignments = await db
    .select({
      assignmentId: questAssignments.id,
      progress: questAssignments.progress,
      completed: questAssignments.completed,
      completedAt: questAssignments.completedAt,
      questTitle: quests.title,
      questDescription: quests.description,
      questType: quests.type,
      requirementAction: quests.requirementAction,
      requirementTarget: quests.requirementTarget,
      rewardCoins: quests.rewardCoins,
      rewardXp: quests.rewardXp,
      difficulty: quests.difficulty,
      expiresAt: quests.expiresAt,
    })
    .from(questAssignments)
    .innerJoin(quests, eq(questAssignments.questId, quests.id))
    .where(
      and(
        eq(questAssignments.userId, userId),
        eq(questAssignments.completed, false)
      )
    );

  return {
    activeCount: assignments.length,
    quests: assignments.map((q) => ({
      title: q.questTitle,
      description: q.questDescription,
      type: q.questType,
      difficulty: q.difficulty,
      progress: q.progress,
      target: q.requirementTarget,
      percentComplete: q.requirementTarget
        ? Math.round((q.progress / q.requirementTarget) * 100)
        : 0,
      rewardCoins: q.rewardCoins,
      rewardXp: q.rewardXp,
      expiresAt: q.expiresAt,
    })),
  };
}

/**
 * Tool 13: getBadges
 * Returns earned badges for the user
 */
export async function getBadges(userId) {
  const earned = await db
    .select({
      badgeId: userBadges.badgeId,
      earnedAt: userBadges.earnedAt,
    })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));

  return {
    totalEarned: earned.length,
    badges: earned.map((b) => ({
      badgeId: b.badgeId,
      earnedAt: b.earnedAt,
    })),
  };
}

// ============================================================
// 👥 SOCIAL TOOLS (2)
// ============================================================

/**
 * Tool 14: getLeaderboard
 * Returns friend leaderboard ranked by coins or goals
 */
export async function getLeaderboard(userId, { type = "coins" }) {
  // Get user's accepted friends (user could be requester or recipient)
  const friendships = await db
    .select({
      requesterId: friends.requesterId,
      recipientId: friends.recipientId,
    })
    .from(friends)
    .where(
      and(
        or(
          eq(friends.requesterId, userId),
          eq(friends.recipientId, userId)
        ),
        eq(friends.status, "accepted")
      )
    );

  // Collect all friend IDs + self
  const friendIds = new Set([userId]);
  for (const f of friendships) {
    friendIds.add(f.requesterId);
    friendIds.add(f.recipientId);
  }

  // Fetch user data for all friends
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      coins: users.coins,
      level: users.level,
      totalGoalsCompleted: users.totalGoalsCompleted,
    })
    .from(users)
    .where(
      or(...[...friendIds].map((id) => eq(users.id, id)))
    );

  // Sort by type
  const sortKey = type === "coins" ? "coins" : "totalGoalsCompleted";
  const sorted = allUsers
    .sort((a, b) => b[sortKey] - a[sortKey])
    .map((u, i) => ({
      rank: i + 1,
      name: u.name,
      avatarUrl: u.avatarUrl,
      coins: u.coins,
      level: u.level,
      totalGoalsCompleted: u.totalGoalsCompleted,
      isYou: u.id === userId,
    }));

  const myRank = sorted.find((u) => u.isYou)?.rank || 0;

  return {
    type,
    totalPlayers: sorted.length,
    myRank,
    leaderboard: sorted.slice(0, 10),
  };
}

/**
 * Tool 15: getFriendStats
 * Returns comparison stats with a specific friend or general friend overview
 */
export async function getFriendStats(userId, { friendId = null }) {
  // Get current user
  const [me] = await db
    .select({
      name: users.name,
      level: users.level,
      coins: users.coins,
      totalGoalsCompleted: users.totalGoalsCompleted,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!me) return { error: "User not found" };

  if (friendId) {
    // Compare with a specific friend
    const [friend] = await db
      .select({
        name: users.name,
        level: users.level,
        coins: users.coins,
        totalGoalsCompleted: users.totalGoalsCompleted,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, friendId));

    if (!friend) return { error: "Friend not found" };

    return {
      comparison: {
        you: {
          name: me.name,
          level: me.level,
          coins: me.coins,
          goalsCompleted: me.totalGoalsCompleted,
        },
        friend: {
          name: friend.name,
          level: friend.level,
          coins: friend.coins,
          goalsCompleted: friend.totalGoalsCompleted,
          avatarUrl: friend.avatarUrl,
        },
        coinsDifference: me.coins - friend.coins,
        levelDifference: me.level - friend.level,
      },
    };
  }

  // General friend count
  const friendships = await db
    .select()
    .from(friends)
    .where(
      and(
        or(
          eq(friends.requesterId, userId),
          eq(friends.recipientId, userId)
        ),
        eq(friends.status, "accepted")
      )
    );

  return {
    totalFriends: friendships.length,
    myStats: {
      name: me.name,
      level: me.level,
      coins: me.coins,
      goalsCompleted: me.totalGoalsCompleted,
    },
  };
}
```

---

### 2. controllers/chatController.js

```javascript
import { streamText, tool } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import * as chatTools from "../ai/services/chatTools.js";

const SYSTEM_PROMPT = `You are Pally, PocketPal's friendly AI coach for students.

## YOUR ROLE
- Help students understand their spending habits
- Track savings goals and streaks
- Celebrate wins and gently highlight areas to improve
- Use tools to get REAL data — never invent numbers

## PERSONALITY
- Warm, encouraging, student-like tone
- Short responses (1-3 sentences for mobile screens)
- Use 1-2 emojis max per response
- Light, playful roasting of CHOICES is allowed (never roast the person)

## EXAMPLES OF GOOD ROASTING
- "Food really said 'I'm the main character' this week 🍔"
- "That impulse buy was fast — your savings didn't even see it coming 😅"

## EXAMPLES OF FORBIDDEN RESPONSES
- "You're bad with money"
- "You should know better"
- Any investment, tax, loan, or legal advice

## RULES
1. Always use tools to get data before answering financial questions
2. Never make up transaction amounts, balances, or statistics
3. Keep responses concise — this is a mobile app
4. If asked about investing/tax/credit, politely refuse and redirect
5. Celebrate milestones and progress enthusiastically
6. Be empathetic about setbacks, never judgmental
7. Use ₹ for currency amounts`;

export const streamChat = async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user.id;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    const result = streamText({
      model: gateway("mistral/devstral-2"),
      system: SYSTEM_PROMPT,
      messages,
      tools: {
        // 💰 Financial Tools
        getWalletBalance: tool({
          description:
            "Get the user's wallet balances including primary, savings, and total balance",
          inputSchema: z.object({}),
          execute: async () => chatTools.getWalletBalance(userId),
        }),
        getRecentTransactions: tool({
          description:
            "Get recent transactions with optional filters for limit, number of days, and category",
          inputSchema: z.object({
            limit: z
              .number()
              .optional()
              .default(10)
              .describe("Max number of transactions to return"),
            days: z
              .number()
              .optional()
              .default(7)
              .describe("Number of days to look back"),
            category: z
              .string()
              .optional()
              .nullable()
              .describe("Filter by category name like Food, Transport, etc."),
          }),
          execute: async (params) =>
            chatTools.getRecentTransactions(userId, params),
        }),
        getSpendingSummary: tool({
          description:
            "Get a spending summary for a given period (week, month, or 3 months)",
          inputSchema: z.object({
            period: z
              .enum(["week", "month", "3m"])
              .describe("Time period to summarize"),
          }),
          execute: async ({ period }) =>
            chatTools.getSpendingSummary(userId, period),
        }),
        getCategoryBreakdown: tool({
          description:
            "Get spending breakdown by category showing how much was spent in each category",
          inputSchema: z.object({
            period: z
              .enum(["week", "month", "3m"])
              .describe("Time period for breakdown"),
          }),
          execute: async ({ period }) =>
            chatTools.getCategoryBreakdown(userId, period),
        }),
        getGoals: tool({
          description:
            "Get the user's savings goals, progress, and featured goal",
          inputSchema: z.object({}),
          execute: async () => chatTools.getGoals(userId),
        }),
        getSubscriptions: tool({
          description:
            "Get the user's active subscriptions and upcoming renewals in the next 7 days",
          inputSchema: z.object({}),
          execute: async () => chatTools.getSubscriptions(userId),
        }),

        // 📊 Analytics Tools
        explainChart: tool({
          description:
            "Generate insights and explanations for a chart showing spending data",
          inputSchema: z.object({
            period: z
              .enum(["week", "month", "3m"])
              .describe("Time period the chart covers"),
            chartType: z
              .enum(["bar", "pie", "line"])
              .describe("Type of chart being displayed"),
          }),
          execute: async (params) => chatTools.explainChart(userId, params),
        }),
        compareSpending: tool({
          description:
            "Compare spending between two different time periods",
          inputSchema: z.object({
            period1: z
              .enum(["week", "month", "3m"])
              .describe("First period to compare"),
            period2: z
              .enum(["week", "month", "3m"])
              .describe("Second period to compare"),
          }),
          execute: async (params) =>
            chatTools.compareSpending(userId, params),
        }),
        getTopSpendingDays: tool({
          description:
            "Get the days when the user spent the most money, ranked by total spending",
          inputSchema: z.object({
            days: z
              .number()
              .optional()
              .default(30)
              .describe("Number of days to look back"),
          }),
          execute: async (params) =>
            chatTools.getTopSpendingDays(userId, params),
        }),
        findLargeTransactions: tool({
          description:
            "Find transactions above a certain amount threshold (large or unusual purchases)",
          inputSchema: z.object({
            threshold: z
              .number()
              .optional()
              .default(500)
              .describe("Minimum amount in ₹ to consider as large"),
            days: z
              .number()
              .optional()
              .default(30)
              .describe("Number of days to look back"),
          }),
          execute: async (params) =>
            chatTools.findLargeTransactions(userId, params),
        }),

        // 🎮 Gamification Tools
        getStreakStatus: tool({
          description:
            "Get the user's current streak, level, coins, and gamification status",
          inputSchema: z.object({}),
          execute: async () => chatTools.getStreakStatus(userId),
        }),
        getActiveQuests: tool({
          description:
            "Get the user's currently active quests with their progress towards completion",
          inputSchema: z.object({}),
          execute: async () => chatTools.getActiveQuests(userId),
        }),
        getBadges: tool({
          description: "Get all badges the user has earned",
          inputSchema: z.object({}),
          execute: async () => chatTools.getBadges(userId),
        }),

        // 👥 Social Tools
        getLeaderboard: tool({
          description:
            "Get the friend leaderboard ranked by coins or goals completed",
          inputSchema: z.object({
            type: z
              .enum(["coins", "goals"])
              .optional()
              .default("coins")
              .describe("Rank by coins or goals completed"),
          }),
          execute: async (params) =>
            chatTools.getLeaderboard(userId, params),
        }),
        getFriendStats: tool({
          description:
            "Get stats comparison with a specific friend, or general friend overview",
          inputSchema: z.object({
            friendId: z
              .string()
              .optional()
              .nullable()
              .describe(
                "UUID of a specific friend to compare with (optional)"
              ),
          }),
          execute: async (params) =>
            chatTools.getFriendStats(userId, params),
        }),
      },
      maxSteps: 5,
    });

    result.pipeDataStreamToResponse(res);
  } catch (error) {
    console.error("[Chat] Stream error:", error);
    res.status(500).json({ message: "Chat failed", error: error.message });
  }
};
```

---

### 3. routes/chatRoutes.js

```javascript
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { streamChat } from "../controllers/chatController.js";

const router = express.Router();

/**
 * POST /api/v1/chat
 * Stream a chat response from Pally AI
 *
 * Body: { messages: [{ role: "user"|"assistant", content: "..." }] }
 * Auth: Bearer token required
 */
router.post("/", protect, streamChat);

export default router;
```

---

### 4. server.js modifications

Add these lines to the existing `server.js`:

```javascript
// Add at the top with other imports
import chatRoutes from "./routes/chatRoutes.js";

// Add with other route registrations (after the existing routes)
app.use("/api/v1/chat", chatRoutes);
```

---

## Mobile Code

### 5. hooks/usePallyChat.ts

```typescript
import { useState, useCallback, useRef } from "react";
import { API_URL } from "./useUser";
import { storage } from "@repo/auth";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UsePallyChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Hook for streaming chat with Pally AI
 *
 * Uses the Vercel AI SDK Data Stream Protocol.
 * The backend streams responses as SSE events, and this hook
 * parses them to build the assistant's response incrementally.
 */
export function usePallyChat(): UsePallyChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Create assistant placeholder
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const token = await storage.get("access_token");
        if (!token) throw new Error("Not authenticated");

        // Abort any previous request
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const response = await fetch(`${API_URL}/api/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Chat failed: ${response.status}`);
        }

        // Read the stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Parse AI SDK Data Stream Protocol
          // Text chunks are prefixed with "0:" and contain JSON-encoded strings
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith("0:")) {
              // Text token
              try {
                const text = JSON.parse(line.slice(2));
                assistantContent += text;

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              } catch {
                // Skip unparseable lines
              }
            }
            // Other prefixes:
            // "2:" = data (tool results, etc.)
            // "9:" = tool call
            // "a:" = tool result
            // "d:" = finish
            // "e:" = finish step
            // We only need text tokens for the UI
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;

        const errorMessage = err.message || "Something went wrong";
        setError(errorMessage);

        // Update assistant message with error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, I couldn't process that. Try again? 🙁" }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
```

---

## Testing

### Test the chat endpoint via curl

```bash
# Get your auth token first, then:
curl -X POST http://localhost:5757/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "messages": [
      { "role": "user", "content": "Where did my money go this week?" }
    ]
  }' \
  --no-buffer
```

You should see streamed SSE output as the AI calls `getCategoryBreakdown` and responds.

### Test individual tools

```javascript
// Create a test file: test-chat-tools.js
import * as tools from "./ai/services/chatTools.js";

const TEST_USER_ID = "your-test-user-uuid";

async function test() {
  console.log("--- Wallet Balance ---");
  console.log(JSON.stringify(await tools.getWalletBalance(TEST_USER_ID), null, 2));

  console.log("\n--- Spending Summary (week) ---");
  console.log(JSON.stringify(await tools.getSpendingSummary(TEST_USER_ID, "week"), null, 2));

  console.log("\n--- Category Breakdown (month) ---");
  console.log(JSON.stringify(await tools.getCategoryBreakdown(TEST_USER_ID, "month"), null, 2));

  console.log("\n--- Goals ---");
  console.log(JSON.stringify(await tools.getGoals(TEST_USER_ID), null, 2));

  console.log("\n--- Streak ---");
  console.log(JSON.stringify(await tools.getStreakStatus(TEST_USER_ID), null, 2));

  console.log("\n--- Active Quests ---");
  console.log(JSON.stringify(await tools.getActiveQuests(TEST_USER_ID), null, 2));

  console.log("\n--- Leaderboard ---");
  console.log(JSON.stringify(await tools.getLeaderboard(TEST_USER_ID, { type: "coins" }), null, 2));
}

test();
```

Run with:
```bash
node test-chat-tools.js
```

---

## Checklist

- [ ] Install `@ai-sdk/gateway` in apps/backend
- [ ] Add `AI_GATEWAY_API_KEY` to `.env`
- [ ] Create `ai/services/chatTools.js` (15 tools)
- [ ] Create `controllers/chatController.js` (stream handler)
- [ ] Create `routes/chatRoutes.js` (endpoint)
- [ ] Update `server.js` to import and register chat route
- [ ] Create `hooks/usePallyChat.ts` (mobile)
- [ ] Update `PallyBottomSheet.tsx` to use `usePallyChat` hook
- [ ] Test each tool individually with a real user UUID
- [ ] Test streaming end-to-end via curl
- [ ] Test from mobile app
