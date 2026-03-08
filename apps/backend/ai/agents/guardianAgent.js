import { generateText, tool } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { db } from "../../config/db.js";
import {
    transactions,
    notifications,
    wallets,
    categories,
} from "../../drizzle/schema.js";
import { eq, and, gte, desc } from "drizzle-orm";
import {
    sendPushNotification,
    saveInAppNotification,
} from "../../services/notificationService.js";

const GUARDIAN_PROMPT = `You are PocketPal's Spending Guardian — a real-time financial watchdog.

You are triggered when a user opens a spending app or is about to pay on one.
Your job is to decide if they need a nudge based on their recent spending in that category.

## RULES
1. If category spending is very low (under ₹200 this week) — skip, no nudge needed
2. If a nudge was sent < 2 hours ago — skip (cooldown)
3. If user has been nudged 3+ times today — skip (daily cap)
4. Be friendly, not preachy. Gen-Z tone. Specific numbers only.
5. Push title: ≤ 50 chars. Body: ≤ 120 chars.
6. Include exact ₹ spend amount and transaction count.
7. For "payment_app_switch" signals, be more urgent — they are likely about to pay.
8. For "app_open" signals, be gentler — they might just be browsing.
9. For "ordering_detected" signals, be direct — they are placing an order right now.

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
 * @param {string} signal - "app_open" | "payment_app_switch" | "ordering_detected"
 */
export async function runGuardianAgent(userId, detectedCategory, signal = "app_open") {
    try {
        const result = await generateText({
            model: gateway("mistral/devstral-2"),
            system: GUARDIAN_PROMPT,
            tools: {
                getCategorySpending: tool({
                    description:
                        "Get how much the user has spent in a specific category this week, including transaction count and recent transactions",
                    inputSchema: z.object({
                        category: z.string().describe("Spending category name"),
                        days: z.number().default(7).describe("Number of days to look back"),
                    }),
                    execute: async ({ category, days }) => {
                        return await getCategorySpendingContext(userId, category, days);
                    },
                }),
                getNudgeHistory: tool({
                    description:
                        "Check the user's recent nudge history to enforce cooldown (2h) and daily cap (3/day)",
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
                            .where(
                                and(eq(wallets.userId, userId), eq(wallets.type, "primary"))
                            );
                        return {
                            balance: wallet ? parseFloat(wallet.balance) : 0,
                        };
                    },
                }),
            },
            maxSteps: 3,
            prompt: `User just triggered a "${signal}" event on category: "${detectedCategory}". 
Should we send a spending nudge? Check their recent spending in this category and nudge history first.`,
        });

        // Parse decision
        let decision;
        try {
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            decision = jsonMatch ? JSON.parse(jsonMatch[0]) : { shouldNudge: false };
        } catch (parseError) {
            console.error(
                `[Guardian] Failed to parse response for ${userId}:`,
                result.text,
            );
            return null;
        }

        if (!decision.shouldNudge) {
            console.log(
                `[Guardian] No nudge for ${userId}: ${decision.reason}`,
            );
            return null;
        }

        // Send push notification
        await sendPushNotification(userId, decision.title, decision.body);

        // Save as in-app notification with type "nudge"
        await saveInAppNotification(userId, {
            type: "nudge",
            title: decision.title,
            body: decision.body,
        });

        console.log(
            `[Guardian] Nudged ${userId}: ${decision.title}`,
        );
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

    // Get all expense transactions with their category names
    const txns = await db
        .select({
            amount: transactions.amount,
            name: transactions.name,
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

    // Filter by category name (case-insensitive partial match)
    // Matches both the transaction name and the category name
    const categoryLower = category.toLowerCase();
    const categoryTxns = txns.filter(
        (t) =>
            t.name.toLowerCase().includes(categoryLower) ||
            (t.categoryName && t.categoryName.toLowerCase().includes(categoryLower))
    );

    const totalSpent = categoryTxns.reduce(
        (sum, t) => sum + Math.abs(parseFloat(t.amount)),
        0
    );

    // Also get overall spending for context
    const totalAllSpent = txns.reduce(
        (sum, t) => sum + Math.abs(parseFloat(t.amount)),
        0
    );

    return {
        category,
        period: `${days} days`,
        categorySpent: Math.round(totalSpent),
        categoryTransactionCount: categoryTxns.length,
        totalSpentAllCategories: Math.round(totalAllSpent),
        totalTransactionCount: txns.length,
        recentCategoryTransactions: categoryTxns.slice(0, 5).map((t) => ({
            name: t.name,
            amount: Math.abs(parseFloat(t.amount)),
            category: t.categoryName,
        })),
    };
}

async function getNudgeHistoryContext(userId) {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

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
        hoursSinceLastNudge: Math.round(hoursSinceLastNudge * 10) / 10,
        nudgesToday,
        cooldownActive: hoursSinceLastNudge < 2,
        dailyCapReached: nudgesToday >= 3,
    };
}
