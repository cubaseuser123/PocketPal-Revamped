import { generateText, tool } from "ai";
import { gateway } from "@ai-sdk/gateway";
// --- Pally fine-tuned model (uncomment when cloud-hosted) ---
// import { createOpenAI } from "@ai-sdk/openai";
// const pally = createOpenAI({
//   baseURL: "YOUR_CLOUD_URL/v1",
//   apiKey: "YOUR_API_KEY",
// });
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
      ? (Date.now() - new Date(lastNotif.createdAt).getTime()) /
      (1000 * 60 * 60)
      : 999;

    const result = await generateText({
      model: gateway("mistral/devstral-2"),
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

    let decision;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : { shouldNotify: false };
    } catch (parseError) {
      console.error(
        `[Agent] failed to parse response for ${userId}:`,
        parseError,
      );
      return null;
    }

    if (!decision.shouldNotify) {
      console.log(
        `[Agent] AI decided there's no notification to be shared for ${userId}, fetching fallback tip....`,
      );

      try {
        const tipsPath = path.join(process.cwd(), "ai", "data", "tips.json");
        const tipsData = await fs.readFile(tipsPath, "utf-8");
        const tips = JSON.parse(tipsData);

        if (tips.length > 0) {
          const randomTip = tips[Math.floor(Math.random() * tips.length)];
          decision = {
            shouldNotify: true,
            type: "insight",
            priority: "in-app",
            title: randomTip.title,
            body: randomTip.body,
            reason:
              "Random tip has been used when no major notification needed",
          };
          console.log(`[Agent] Selected fallback tip: ${decision.title}`);
        } else {
          console.log(`[Agent] No tips found in tips.json`);
          return null;
        }
      } catch (error) {
        console.error(`[Agent] Error fetching tips: ${error.message}`);
        return null;
      }
    }
    if (decision.priority === "push") {
      const pushSent = await sendPushNotification(
        userId,
        decision.title,
        decision.body,
      );
      if (!pushSent) {
        console.log(`[Agent] Push failed for ${userId}, saving as in-app`);
      }
    }
    await saveInAppNotification(userId, {
      type: decision.type,
      title: decision.title,
      body: decision.body,
    });
    console.log(
      `[Agent] notified user ${userId}: ${decision.type} - ${decision.title}`,
    );
    return decision;
  } catch (error) {
    console.error(`[Agent] Error for user ${userId}:`, error);
    return null;
  }
}
