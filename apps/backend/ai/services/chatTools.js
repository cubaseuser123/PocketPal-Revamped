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
