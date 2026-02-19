import { db } from "../../config/db.js";
import {
  users,
  wallets,
  goals,
  subscriptions,
  categories,
  transactions,
} from "../../drizzle/schema.js";
import { eq, desc, gte, and, sql } from "drizzle-orm";

//fetching wallet balance

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

//fetching transaction details for analysis

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
      and(
        eq(transactions.userId, userId),
        gte(transactions.createdAt, startDate),
      ),
    )
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  let totalSpent = 0;
  const byCategory = {};

  //total calculation for that category
  for (const txn of txns) {
    if (txn.type === "expense") {
      const amount = Math.abs(parseFloat(txn.amount));
      totalSpent += amount;
      const cat = txn.categoryName || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    }
  }

  //finding the top category now
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

//fetching details for goals now

export async function getGoalContext(userId) {
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  const activeGoals = userGoals.filter((g) => !g.isCompleted);
  const featured = userGoals.find((g) => g.isFeatured) || activeGoals[0];

  //checking goals that are behind schedule now

  const now = new Date();
  const goalsAtRisk = activeGoals.filter((g) => {
    if (!g.targetDate) return false;
    const target = parseFloat(g.targetAmount);
    const current = parseFloat(g.currentAmount);
    const progress = current / target;
    const daysLeft = Math.ceil(
      (new Date(g.targetDate) - now) / (1000 * 60 * 60 * 24),
    );
    const targetProgress = 1 - daysLeft / 30;
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
              100,
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
        (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100,
      ),
    })),
  };
}

//now fetching subscription details

export async function getSubscriptionContext(userId) {
  const userSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")),
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
    0,
  );

  return {
    activeCount: userSubs.length,
    monthlyTotal: Math.round(monthlyTotal),
    upcomingRenewals: upcomingRenewals.map((s) => ({
      name: s.name,
      price: parseFloat(s.price),
      renewalDate: s.nextRenewal,
      daysUntilRenewal: Math.ceil(
        (new Date(s.nextRenewal) - now) / (1000 * 60 * 60 * 24),
      ),
    })),
  };
}
