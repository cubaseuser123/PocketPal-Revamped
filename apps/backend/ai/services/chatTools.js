import { start } from "repl";
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
import { parse } from "path";

/*
  The first tool call is going to be getWalletBalance
  Returns primary + savings wallet balances
 */

export async function getWalletBalance(userId) {
    const userWallets = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId));

    const primary = userWallets.find((w) => w.type === 'primary');
    const savings = userWallets.find((w) => w.type === 'savings');

    return {
        primaryBalance: primary ? parseFloat(primary.balance) : 0,
        savingsBalance: savings ? parseFloat(savings.balance) : 0,
        totalBalance:
            (primary ? parseFloat(primary.balance) : 0) +
            (savings ? parseFloat(savings.balance0) : 0),
        ppiType: primary?.ppiType || 'small_ppi',
        monthlyLoaded: primary ? parseFloat(primary.monthlyLoaded) : 0,
    };
}

/**
  The second tool call is going to be getRedentTransactions
  Returns recent transactions with optional filters
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
            id: transcations_id,
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

    //logic for the filter

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
            category: t.categoryName || 'Other',
            categoryEmoji: t.categoryEmoji || '💰',
            note: t.note,
            date: t.createdAt,
        })),
        count: filtered.length,
        period: `${days} days`,
    };
}

/**
  The third tool call is going to be getSpendingSummary
  Returns total spending for a period
 */

export async function getSpendingSummary(userId, period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
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
        if (txn.type === 'expense') totalSpent += amount;
        if (txn.type === 'income') totalIncome += amount;
    }

    return {
        period: `${days} days`,
        totalSpent: Math.round(totalSpent),
        totalIncome: Math.round(totalIncome),
        netFlow: Math.round(totalSpent / days),
        transactionCount: txns.length,
    };
}

/**
  The fourth tool call is going to be getCategoryBreakdown
  Returns spending breakdown by category
 */

export async function getCategoryBreakdown(userId, period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
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
                eq(transactions.type, 'expense'),
                gte(transactions.createdAt, startDate)
            )
        );
    const byCategory = {};
    let totalSpent = 0;

    for (const txn of txns0) {
        const amount = Math.abs(parseFloat(txn.amount));
        totalSpent += amount;
        const cat = txn.categoryName || 'Other';
        const emoji = txn.categoryEmoji || '💰';

        if (!byCategory[cat]) {
            byCategory[cat] = { name: cat, emoji, amount: 0, count: 0 };
        }
        byCategory[cat].amount += amount;
        byCategory[cat].count += 1;
    }

    //Now we sort based on amount descending and calculate percentages 
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
  The fifth tool call is going to be getGoals
  Returns user's goals and progress
 */

export async function getGoals(userId) {
    const userGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId));

    const activeGoals = userGoals.filter((g) => !g.isCompleted);
    const completedGoals = userGoals.filter((g) => g.isCompleted);
    const featured = userGoals.find((g) => g.isFeatured || activeGoals[0]);

    return {
        totalGoals: userGoals.length,
        activeCount: activeGoals.length,
        completedCount: completedGoals.length,
        featuredGoal: featured ? {
            name: featured.name,
            emoji: featured.emoji,
            color: featured.color,
            progress: Math.round(
                (parseFloat(featured.currentAmount) / parseFloat(featured.targetAmount)) * 100
            ),
            currentAmount: parseFloat(featured.currentAmount),
            targetAmount: parseFloat(featured.targetAmount),
            remaining: parseFloat(featured.targetAmount) - parseFloat(featured.currentAmount),
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
  The sixth tool call is going to be getSubscriptions
  Returns active subscriptions and upcoming renewals
 */

export async function getSubscriptions(userId) {
    const userSubs = await db
        .select()
        .from(subscriptions)
        .where(
            and(
                eq(subscriptions.userId, userId),
                eq(subscriptions.status, 'active')
            )
        );
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcoming = userSubs.filter((s) => {
        const renewal = new Date(s.nextRenewal);
        return renewal >= now && renewal <= nextWeek;
    });

    const monthlyTotal = userSubs.reduce(
        (sum, s) => sum + parseFloat(s.price), 0
    );

    return {
        activeCount: userSubs.length,
        monthlyTotal: Math.round(monthlyTotal),
        subscriptions: userSubs.map((s) => ({
            name: s.name,
            price: parseFloat(s.price),
            renewalDate: s.nextRenewal,
            daysUntilRenewal: Math.ceil(
                (new Date(s.nextRenewal) - now) / (1000 * 60 * 60 * 24)
            ),
        })),
    };
}


