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
                        "Get recent transactions with optional filters. Use days=365 and limit=1 when the user asks for their 'last' or 'most recent' transaction. Use larger days values to avoid missing data.",
                    inputSchema: z.object({
                        limit: z
                            .number()
                            .optional()
                            .default(10)
                            .describe("Max number of transactions to return"),
                        days: z
                            .number()
                            .optional()
                            .default(30)
                            .describe("Number of days to look back. Use 365 when looking for the most recent/last transaction."),
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

        result.pipeTextStreamToResponse(res);
    } catch (error) {
        console.error("[Chat] Stream error:", error);
        res.status(500).json({ message: "Chat failed", error: error.message });
    }
};
