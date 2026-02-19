# Pally AI Chatbot System - Code Reference

Complete code reference for implementing the Pally AI chatbot with 15 tools.

---

## File Structure

```
apps/backend/
├── ai/                              # AI-related code
│   ├── tools/
│   │   └── chatTools.js             # 15 tool implementations
│   ├── services/
│   │   └── contextAggregator.js     # Shared data fetchers (reuse from agents)
│   └── config/
│       └── aiConfig.js              # AI Gateway configuration (existing)
├── controllers/
│   └── chatController.js            # Stream handler
├── routes/
│   └── chatRoutes.js                # Chat endpoint
└── server.js                        # Import chat routes

apps/mobile/
├── hooks/
│   └── usePallyChat.ts              # Streaming chat hook
└── components/pally/
    └── PallyBottomSheet.tsx         # Chat UI integration
```

---

## Dependencies to Install

```bash
# In apps/backend (if not already installed)
npm install ai @ai-sdk/google zod
```

**package.json additions:**
```json
{
  "dependencies": {
    "@ai-sdk/google": "^1.0.0",
    "ai": "^4.0.0",
    "zod": "^3.23.0"
  }
}
```

---

## Environment Variables

```env
# Add to apps/backend/.env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

---

## Backend Code

### 1. ai/tools/chatTools.js

```javascript
import { db } from "../../config/db.js";
import { 
  users, 
  wallets, 
  transactions, 
  goals, 
  subscriptions, 
  categories,
  streaks,
  quests,
  badges,
  leaderboards
} from "../../drizzle/schema.js";
import { eq, desc, gte, and, sql, between, lte } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 1: FINANCIAL DATA (6 tools)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get wallet balances (primary + savings)
 */
export async function getWalletBalance(userId) {
  const userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  const primary = userWallets.find((w) => w.type === "primary");
  const savings = userWallets.find((w) => w.type === "savings");

  return {
    primary: primary ? parseFloat(primary.balance) : 0,
    savings: savings ? parseFloat(savings.balance) : 0,
    total: 
      (primary ? parseFloat(primary.balance) : 0) + 
      (savings ? parseFloat(savings.balance) : 0),
    currency: "INR",
    lastUpdated: primary?.updatedAt || new Date().toISOString(),
  };
}

/**
 * Get recent transactions with optional filters
 */
export async function getRecentTransactions(userId, { limit = 10, days = 7, category = null } = {}) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = db
    .select({
      id: transactions.id,
      name: transactions.name,
      amount: transactions.amount,
      type: transactions.type,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId), 
        gte(transactions.createdAt, startDate)
      )
    );

  // Filter by category if provided
  if (category) {
    query = query.where(eq(categories.name, category));
  }

  const txns = await query
    .orderBy(desc(transactions.createdAt))
    .limit(limit);

  return {
    transactions: txns.map((t) => ({
      id: t.id,
      name: t.name,
      amount: parseFloat(t.amount),
      type: t.type,
      category: t.categoryName || "Uncategorized",
      emoji: t.categoryEmoji || "💸",
      date: t.createdAt,
    })),
    count: txns.length,
    period: `Last ${days} days`,
  };
}

/**
 * Get spending summary for a period
 */
export async function getSpendingSummary(userId, period = "week") {
  const now = new Date();
  let startDate = new Date();
  let periodDays = 7;

  switch (period) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      periodDays = 7;
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      periodDays = 30;
      break;
    case "3m":
      startDate.setMonth(now.getMonth() - 3);
      periodDays = 90;
      break;
    default:
      startDate.setDate(now.getDate() - 7);
      periodDays = 7;
  }

  const txns = await db
    .select({ amount: transactions.amount, type: transactions.type })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.createdAt, startDate),
        eq(transactions.type, "expense")
      )
    );

  const totalSpent = txns.reduce(
    (sum, t) => sum + Math.abs(parseFloat(t.amount)), 
    0
  );

  return {
    period,
    periodDays,
    totalSpent: Math.round(totalSpent),
    avgPerDay: Math.round(totalSpent / periodDays),
    transactionCount: txns.length,
    currency: "INR",
  };
}

/**
 * Get spending breakdown by category
 */
export async function getCategoryBreakdown(userId, period = "week") {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      startDate.setMonth(now.getMonth() - 3);
      break;
  }

  const txns = await db
    .select({
      amount: transactions.amount,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.createdAt, startDate),
        eq(transactions.type, "expense")
      )
    );

  // Aggregate by category
  const byCategory = {};
  let totalSpent = 0;

  for (const txn of txns) {
    const cat = txn.categoryName || "Other";
    const amount = Math.abs(parseFloat(txn.amount));
    totalSpent += amount;

    if (!byCategory[cat]) {
      byCategory[cat] = {
        name: cat,
        emoji: txn.categoryEmoji || "💸",
        amount: 0,
        count: 0,
      };
    }
    byCategory[cat].amount += amount;
    byCategory[cat].count += 1;
  }

  // Sort by amount and calculate percentages
  const categories = Object.values(byCategory)
    .map((cat) => ({
      ...cat,
      amount: Math.round(cat.amount),
      percentage: totalSpent > 0 ? Math.round((cat.amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    period,
    totalSpent: Math.round(totalSpent),
    categories,
    topCategory: categories[0] || null,
  };
}

/**
 * Get savings goals and progress
 */
export async function getGoals(userId) {
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.isFeatured), desc(goals.createdAt));

  const activeGoals = userGoals.filter((g) => !g.isCompleted);
  const completedGoals = userGoals.filter((g) => g.isCompleted);

  return {
    totalGoals: userGoals.length,
    activeCount: activeGoals.length,
    completedCount: completedGoals.length,
    goals: userGoals.map((g) => {
      const current = parseFloat(g.currentAmount);
      const target = parseFloat(g.targetAmount);
      const progress = target > 0 ? Math.round((current / target) * 100) : 0;
      const remaining = target - current;
      const daysLeft = g.targetDate 
        ? Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        currentAmount: current,
        targetAmount: target,
        progress,
        remaining: Math.max(0, remaining),
        isCompleted: g.isCompleted,
        isFeatured: g.isFeatured,
        targetDate: g.targetDate,
        daysLeft,
      };
    }),
  };
}

/**
 * Get active subscriptions
 */
export async function getSubscriptions(userId) {
  const userSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))
    );

  const now = new Date();
  const monthlyTotal = userSubs.reduce(
    (sum, s) => sum + parseFloat(s.price),
    0
  );

  return {
    subscriptions: userSubs.map((s) => {
      const renewalDate = new Date(s.nextRenewal);
      const daysUntilRenewal = Math.ceil(
        (renewalDate - now) / (1000 * 60 * 60 * 24)
      );

      return {
        id: s.id,
        name: s.name,
        price: parseFloat(s.price),
        billingCycle: s.billingCycle,
        nextRenewal: s.nextRenewal,
        daysUntilRenewal,
        category: s.category,
      };
    }),
    count: userSubs.length,
    monthlyTotal: Math.round(monthlyTotal),
  };
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 2: ANALYTICS & INSIGHTS (4 tools)
// ═══════════════════════════════════════════════════════════════════

/**
 * Explain chart data for a given period
 */
export async function explainChart(userId, { period = "week", chartType = "spending" }) {
  // Get the raw data for the chart
  const breakdown = await getCategoryBreakdown(userId, period);
  const summary = await getSpendingSummary(userId, period);

  return {
    chartType,
    period,
    insights: {
      totalSpent: summary.totalSpent,
      avgPerDay: summary.avgPerDay,
      topCategory: breakdown.topCategory,
      categoryCount: breakdown.categories.length,
      topThreeCategories: breakdown.categories.slice(0, 3),
    },
    narrative: `In the past ${period}, you spent ₹${summary.totalSpent} across ${breakdown.categories.length} categories. ${breakdown.topCategory?.name || "General spending"} was your biggest expense at ₹${breakdown.topCategory?.amount || 0}.`,
  };
}

/**
 * Compare spending between two periods
 */
export async function compareSpending(userId, { period1 = "week", period2 = "month" }) {
  const [summary1, summary2] = await Promise.all([
    getSpendingSummary(userId, period1),
    getSpendingSummary(userId, period2),
  ]);

  // Calculate normalized comparison (per day)
  const diff = summary1.avgPerDay - (summary2.totalSpent / summary2.periodDays);
  const percentChange = summary2.avgPerDay > 0
    ? Math.round(((summary1.avgPerDay - summary2.avgPerDay) / summary2.avgPerDay) * 100)
    : 0;

  return {
    period1: {
      name: period1,
      totalSpent: summary1.totalSpent,
      avgPerDay: summary1.avgPerDay,
    },
    period2: {
      name: period2,
      totalSpent: summary2.totalSpent,
      avgPerDay: Math.round(summary2.totalSpent / summary2.periodDays),
    },
    comparison: {
      dailyDifference: Math.round(diff),
      percentChange,
      trend: percentChange > 5 ? "increasing" : percentChange < -5 ? "decreasing" : "stable",
    },
  };
}

/**
 * Get top spending days
 */
export async function getTopSpendingDays(userId, { days = 30 }) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const txns = await db
    .select({
      amount: transactions.amount,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.createdAt, startDate),
        eq(transactions.type, "expense")
      )
    );

  // Group by date
  const byDate = {};
  for (const txn of txns) {
    const date = new Date(txn.createdAt).toISOString().split("T")[0];
    if (!byDate[date]) {
      byDate[date] = { date, amount: 0, count: 0 };
    }
    byDate[date].amount += Math.abs(parseFloat(txn.amount));
    byDate[date].count += 1;
  }

  // Sort and get top 5
  const topDays = Object.values(byDate)
    .map((d) => ({ ...d, amount: Math.round(d.amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    period: `Last ${days} days`,
    topDays,
    highestSpendingDay: topDays[0] || null,
  };
}

/**
 * Find large transactions above threshold
 */
export async function findLargeTransactions(userId, { threshold = 500, days = 30 }) {
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
      and(
        eq(transactions.userId, userId),
        gte(transactions.createdAt, startDate)
      )
    )
    .orderBy(desc(sql`ABS(${transactions.amount})`))
    .limit(20);

  const largeTransactions = txns
    .filter((t) => Math.abs(parseFloat(t.amount)) >= threshold)
    .map((t) => ({
      id: t.id,
      name: t.name,
      amount: parseFloat(t.amount),
      type: t.type,
      category: t.categoryName || "Uncategorized",
      date: t.createdAt,
    }));

  return {
    threshold,
    period: `Last ${days} days`,
    transactions: largeTransactions,
    count: largeTransactions.length,
    totalAmount: Math.round(
      largeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    ),
  };
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 3: GAMIFICATION (3 tools)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get streak status
 */
export async function getStreakStatus(userId) {
  const [userStreak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId));

  if (!userStreak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckin: null,
      isActive: false,
      message: "Start your first streak!",
    };
  }

  const now = new Date();
  const lastCheckin = new Date(userStreak.lastCheckin);
  const hoursSinceCheckin = (now - lastCheckin) / (1000 * 60 * 60);
  const isActive = hoursSinceCheckin < 48; // 48-hour grace period

  return {
    currentStreak: userStreak.currentStreak,
    longestStreak: userStreak.longestStreak,
    lastCheckin: userStreak.lastCheckin,
    isActive,
    streakType: userStreak.type, // e.g., "savings", "budget"
    nextMilestone: Math.ceil(userStreak.currentStreak / 7) * 7,
    daysToMilestone: Math.ceil(userStreak.currentStreak / 7) * 7 - userStreak.currentStreak,
  };
}

/**
 * Get active quests and progress
 */
export async function getActiveQuests(userId) {
  const userQuests = await db
    .select()
    .from(quests)
    .where(
      and(eq(quests.userId, userId), eq(quests.status, "active"))
    );

  return {
    quests: userQuests.map((q) => ({
      id: q.id,
      name: q.name,
      description: q.description,
      type: q.type,
      targetValue: q.targetValue,
      currentValue: q.currentValue,
      progress: q.targetValue > 0 
        ? Math.round((q.currentValue / q.targetValue) * 100) 
        : 0,
      reward: q.reward,
      expiresAt: q.expiresAt,
      daysLeft: q.expiresAt 
        ? Math.ceil((new Date(q.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        : null,
    })),
    activeCount: userQuests.length,
  };
}

/**
 * Get badges (earned and available)
 */
export async function getBadges(userId) {
  const userBadges = await db
    .select()
    .from(badges)
    .where(eq(badges.userId, userId));

  const earned = userBadges.filter((b) => b.earnedAt);
  const locked = userBadges.filter((b) => !b.earnedAt);

  return {
    earned: earned.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      emoji: b.emoji,
      earnedAt: b.earnedAt,
      rarity: b.rarity,
    })),
    locked: locked.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      emoji: b.emoji,
      requirement: b.requirement,
      rarity: b.rarity,
    })),
    earnedCount: earned.length,
    totalCount: userBadges.length,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY 4: SOCIAL (2 tools)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get leaderboard standings
 */
export async function getLeaderboard(userId, { type = "coins" }) {
  // Get user's friends (simplified - adjust based on your friend system)
  const leaderboardData = await db
    .select({
      userId: leaderboards.userId,
      username: users.name,
      score: leaderboards.score,
      rank: leaderboards.rank,
    })
    .from(leaderboards)
    .leftJoin(users, eq(leaderboards.userId, users.id))
    .where(eq(leaderboards.type, type))
    .orderBy(desc(leaderboards.score))
    .limit(10);

  // Find user's position
  const userPosition = leaderboardData.findIndex((l) => l.userId === userId);
  const userEntry = leaderboardData.find((l) => l.userId === userId);

  return {
    type,
    leaderboard: leaderboardData.map((l, idx) => ({
      rank: idx + 1,
      userId: l.userId,
      username: l.username,
      score: l.score,
      isCurrentUser: l.userId === userId,
    })),
    userRank: userPosition >= 0 ? userPosition + 1 : null,
    userScore: userEntry?.score || 0,
  };
}

/**
 * Get friend's stats comparison
 */
export async function getFriendStats(userId, { friendId = null }) {
  // Get user's own stats
  const userSummary = await getSpendingSummary(userId, "week");
  const userGoals = await getGoals(userId);
  const userStreak = await getStreakStatus(userId);

  // If no specific friend, return user's stats for comparison context
  if (!friendId) {
    return {
      user: {
        weeklySpending: userSummary.totalSpent,
        activeGoals: userGoals.activeCount,
        completedGoals: userGoals.completedCount,
        currentStreak: userStreak.currentStreak,
      },
      message: "Specify a friend to compare stats!",
    };
  }

  // Get friend's stats
  const friendSummary = await getSpendingSummary(friendId, "week");
  const friendGoals = await getGoals(friendId);
  const friendStreak = await getStreakStatus(friendId);

  // Get friend's name
  const [friend] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, friendId));

  return {
    user: {
      weeklySpending: userSummary.totalSpent,
      activeGoals: userGoals.activeCount,
      completedGoals: userGoals.completedCount,
      currentStreak: userStreak.currentStreak,
    },
    friend: {
      name: friend?.name || "Friend",
      weeklySpending: friendSummary.totalSpent,
      activeGoals: friendGoals.activeCount,
      completedGoals: friendGoals.completedCount,
      currentStreak: friendStreak.currentStreak,
    },
    comparison: {
      spendingDiff: userSummary.totalSpent - friendSummary.totalSpent,
      streakDiff: userStreak.currentStreak - friendStreak.currentStreak,
    },
  };
}
```

---

### 2. controllers/chatController.js

```javascript
import { streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import * as chatTools from "../ai/tools/chatTools.js";

const SYSTEM_PROMPT = `You are Pally, PocketPal's friendly AI coach for students.

## PERSONALITY
- Warm, encouraging, and playful
- Use 1-2 emojis per response (not more)
- Keep responses short (1-3 sentences for mobile)
- Be specific with ₹ amounts and percentages
- Celebrate wins, be empathetic about setbacks

## RULES
1. NEVER invent numbers - all data comes from tools
2. NEVER give investment, tax, or loan advice
3. Roast choices playfully, never roast the person
4. If unsure what user wants, ask for clarification
5. One tool call per response

## ALLOWED LIGHT ROASTING
✅ "Food really said 'I'm the main character' this week 🍔"
✅ "Your streak was sweating a little there 👀"
❌ "You're bad with money" (NEVER)
❌ "What were you thinking?" (NEVER)

## REFUSAL STYLE
When asked about investments/taxes/loans, say:
"I can't help with that, but I can show you where your money usually goes or help you track a savings goal 🎯"`;

export const streamChat = async (req, res) => {
  const { messages } = req.body;
  const userId = req.user.id;

  try {
    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: SYSTEM_PROMPT,
      messages,
      tools: {
        // ═══════════════════════════════════════════════════════════
        // FINANCIAL TOOLS (6)
        // ═══════════════════════════════════════════════════════════
        getWalletBalance: tool({
          description: "Get user's wallet balances (primary + savings accounts)",
          parameters: z.object({}),
          execute: async () => chatTools.getWalletBalance(userId),
        }),

        getRecentTransactions: tool({
          description: "Get user's recent transactions with optional filters",
          parameters: z.object({
            limit: z.number().default(10).describe("Max transactions to return"),
            days: z.number().default(7).describe("Number of days to look back"),
            category: z.string().optional().describe("Filter by category name"),
          }),
          execute: async (params) => chatTools.getRecentTransactions(userId, params),
        }),

        getSpendingSummary: tool({
          description: "Get spending total and average for a period",
          parameters: z.object({
            period: z.enum(["week", "month", "3m"]).describe("Time period"),
          }),
          execute: async ({ period }) => chatTools.getSpendingSummary(userId, period),
        }),

        getCategoryBreakdown: tool({
          description: "Get spending breakdown by category for a period",
          parameters: z.object({
            period: z.enum(["week", "month", "3m"]).describe("Time period"),
          }),
          execute: async ({ period }) => chatTools.getCategoryBreakdown(userId, period),
        }),

        getGoals: tool({
          description: "Get user's savings goals and their progress",
          parameters: z.object({}),
          execute: async () => chatTools.getGoals(userId),
        }),

        getSubscriptions: tool({
          description: "Get user's active subscriptions and renewal dates",
          parameters: z.object({}),
          execute: async () => chatTools.getSubscriptions(userId),
        }),

        // ═══════════════════════════════════════════════════════════
        // ANALYTICS TOOLS (4)
        // ═══════════════════════════════════════════════════════════
        explainChart: tool({
          description: "Explain chart data and provide insights",
          parameters: z.object({
            period: z.enum(["week", "month", "3m"]).default("week"),
            chartType: z.string().default("spending"),
          }),
          execute: async (params) => chatTools.explainChart(userId, params),
        }),

        compareSpending: tool({
          description: "Compare spending between two periods",
          parameters: z.object({
            period1: z.enum(["week", "month", "3m"]).describe("First period"),
            period2: z.enum(["week", "month", "3m"]).describe("Second period"),
          }),
          execute: async (params) => chatTools.compareSpending(userId, params),
        }),

        getTopSpendingDays: tool({
          description: "Find the days with highest spending",
          parameters: z.object({
            days: z.number().default(30).describe("Number of days to analyze"),
          }),
          execute: async (params) => chatTools.getTopSpendingDays(userId, params),
        }),

        findLargeTransactions: tool({
          description: "Find transactions above a certain amount",
          parameters: z.object({
            threshold: z.number().default(500).describe("Minimum amount in INR"),
            days: z.number().default(30).describe("Number of days to look back"),
          }),
          execute: async (params) => chatTools.findLargeTransactions(userId, params),
        }),

        // ═══════════════════════════════════════════════════════════
        // GAMIFICATION TOOLS (3)
        // ═══════════════════════════════════════════════════════════
        getStreakStatus: tool({
          description: "Get user's current savings/budget streak status",
          parameters: z.object({}),
          execute: async () => chatTools.getStreakStatus(userId),
        }),

        getActiveQuests: tool({
          description: "Get user's active quests and their progress",
          parameters: z.object({}),
          execute: async () => chatTools.getActiveQuests(userId),
        }),

        getBadges: tool({
          description: "Get user's earned and available badges",
          parameters: z.object({}),
          execute: async () => chatTools.getBadges(userId),
        }),

        // ═══════════════════════════════════════════════════════════
        // SOCIAL TOOLS (2)
        // ═══════════════════════════════════════════════════════════
        getLeaderboard: tool({
          description: "Get leaderboard rankings among friends",
          parameters: z.object({
            type: z.enum(["coins", "goals"]).default("coins"),
          }),
          execute: async (params) => chatTools.getLeaderboard(userId, params),
        }),

        getFriendStats: tool({
          description: "Compare stats with a friend",
          parameters: z.object({
            friendId: z.string().optional().describe("Friend's user ID"),
          }),
          execute: async (params) => chatTools.getFriendStats(userId, params),
        }),
      },
      maxSteps: 5, // Allow up to 5 tool calls per conversation
    });

    // Pipe the stream directly to the response
    result.pipeDataStreamToResponse(res);
  } catch (error) {
    console.error("[Chat] Error:", error);
    res.status(500).json({ error: "Chat processing failed" });
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
 * Stream chat response from Pally AI
 * 
 * Request body:
 * {
 *   messages: [
 *     { role: "user", content: "Where did my money go?" }
 *   ]
 * }
 * 
 * Response: Server-Sent Events stream
 */
router.post("/", protect, streamChat);

/**
 * GET /api/v1/chat/health
 * Health check for chat service
 */
router.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "pally-chat",
    timestamp: new Date().toISOString() 
  });
});

export default router;
```

---

### 4. server.js modifications

Add these lines to your existing server.js:

```javascript
// Add at the top with other imports
import chatRoutes from "./routes/chatRoutes.js";

// Add with other route registrations
app.use("/api/v1/chat", chatRoutes);
```

---

## Mobile Code

### 5. hooks/usePallyChat.ts

```typescript
import { useState, useCallback, useRef } from "react";
import { API_URL } from "./useUser";
import { auth } from "@repo/auth";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface UsePallyChatOptions {
  onError?: (error: Error) => void;
}

export function usePallyChat(options: UsePallyChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      createdAt: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create placeholder for assistant response
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      },
    ]);

    try {
      const token = await auth.getToken();
      abortControllerRef.current = new AbortController();

      // Prepare messages for API (all messages including new user message)
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: content.trim() },
      ];

      const response = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE data (Vercel AI SDK format)
        const lines = chunk.split("\n").filter((line) => line.trim());
        
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Text content chunk
            try {
              const content = JSON.parse(line.slice(2));
              fullContent += content;
              
              // Update assistant message with accumulated content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            } catch {
              // Not JSON, might be raw text
              fullContent += line.slice(2);
            }
          }
        }
      }

      // Finalize the message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: fullContent || "I couldn't process that request." }
            : m
        )
      );
    } catch (err) {
      const error = err as Error;
      
      if (error.name === "AbortError") {
        // Request was cancelled
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      } else {
        setError(error);
        options.onError?.(error);
        
        // Update with error message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: "Sorry, something went wrong. Try again? 🙏" }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, options]);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      // Remove the last assistant message and retry
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelRequest,
    clearMessages,
    retryLastMessage,
  };
}
```

---

### 6. components/pally/PallyBottomSheet.tsx (Integration Example)

```tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { usePallyChat, Message } from "../../hooks/usePallyChat";

interface PallyBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PallyBottomSheet({ isOpen, onClose }: PallyBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<FlatList>(null);
  const [input, setInput] = useState("");
  
  const { messages, isLoading, sendMessage, clearMessages } = usePallyChat({
    onError: (error) => console.error("Chat error:", error),
  });

  // Handle sheet visibility
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === "user" ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.role === "user" ? styles.userText : styles.assistantText,
        ]}
      >
        {item.content}
      </Text>
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["50%", "85%"]}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pally 🐱</Text>
          <TouchableOpacity onPress={clearMessages}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>
                Ask me about your spending, goals, or streaks!
              </Text>
            </View>
          }
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>Pally is thinking...</Text>
          </View>
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Pally anything..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sheetBackground: {
    backgroundColor: "#1f2937",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: "#4b5563",
    width: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  clearButton: {
    color: "#6366f1",
    fontSize: 14,
  },
  messageList: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#6366f1",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#374151",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#ffffff",
  },
  assistantText: {
    color: "#e5e7eb",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  loadingText: {
    color: "#9ca3af",
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  input: {
    flex: 1,
    backgroundColor: "#374151",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#ffffff",
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#6366f1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#4b5563",
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
```

---

## Testing

### Test the chat endpoint locally

```javascript
// Create a test file: test-chat.js
import fetch from "node-fetch";

const API_URL = "http://localhost:3000";
const TEST_TOKEN = "your-test-jwt-token";

async function testChat() {
  console.log("Testing Pally chat...");
  
  const response = await fetch(`${API_URL}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_TOKEN}`,
    },
    body: JSON.stringify({
      messages: [
        { role: "user", content: "Where did my money go this week?" }
      ],
    }),
  });

  if (!response.ok) {
    console.error("Request failed:", response.status);
    return;
  }

  // Read the stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(decoder.decode(value));
  }

  console.log("\n\nChat test complete!");
}

testChat();
```

Run with:
```bash
node test-chat.js
```

---

## Sample Queries to Test

| Query | Expected Tool | Response Type |
|-------|---------------|---------------|
| "What's my balance?" | `getWalletBalance` | Balance amounts |
| "Where did my money go?" | `getCategoryBreakdown` | Category breakdown |
| "Show me my goals" | `getGoals` | Goal progress list |
| "How's my streak?" | `getStreakStatus` | Streak info |
| "Any big expenses recently?" | `findLargeTransactions` | Large transactions |
| "Compare this week to last month" | `compareSpending` | Spending comparison |
| "What subscriptions do I have?" | `getSubscriptions` | Subscription list |
| "What badges have I earned?" | `getBadges` | Badge list |
| "Where am I on the leaderboard?" | `getLeaderboard` | Ranking info |
| "Should I invest in crypto?" | None (refusal) | Polite refusal |

---

## Checklist

- [ ] Install dependencies: `npm install ai @ai-sdk/google zod`
- [ ] Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env`
- [ ] Create `ai/tools/chatTools.js`
- [ ] Create `controllers/chatController.js`
- [ ] Create `routes/chatRoutes.js`
- [ ] Update `server.js` to import chat routes
- [ ] Create `hooks/usePallyChat.ts` (mobile)
- [ ] Integrate `PallyBottomSheet.tsx` with hook
- [ ] Test all 15 tools with sample queries
- [ ] Test streaming in mobile app
- [ ] Test refusal responses (investment advice)
