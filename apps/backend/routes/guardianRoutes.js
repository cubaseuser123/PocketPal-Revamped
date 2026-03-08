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

        // Skip Plan B if Autonomous Mode is on — Plan C handles it more precisely
        if (req.user.autonomousModeEnabled) {
            return res.json({ skipped: true, reason: "Autonomous Mode active — Plan C handles spending detection" });
        }

        // Check if Plan B is enabled for this user (default: true)
        if (!req.user.planBEnabled) {
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
        if (!req.user.autonomousModeEnabled) {
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

        const [updated] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, req.user.id))
            .returning();

        res.json({
            success: true,
            updated: {
                planBEnabled: updated.planBEnabled,
                autonomousModeEnabled: updated.autonomousModeEnabled,
            },
        });
    } catch (error) {
        console.error("[Guardian] /settings error:", error);
        res.status(500).json({ message: "Failed to update settings" });
    }
});

/**
 * GET /api/v1/guardian/settings
 * Get current guardian mode preferences
 */
router.get("/settings", protect, async (req, res) => {
    try {
        res.json({
            planBEnabled: req.user.planBEnabled,
            autonomousModeEnabled: req.user.autonomousModeEnabled,
        });
    } catch (error) {
        console.error("[Guardian] GET /settings error:", error);
        res.status(500).json({ message: "Failed to fetch settings" });
    }
});

/**
 * POST /api/v1/guardian/test
 * DEV ONLY — manually trigger the guardian agent for testing
 * Body: { category?: string, signal?: string }
 */
router.post("/test", protect, async (req, res) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ message: "Not available in production" });
    }

    try {
        const { category = "Food Delivery", signal = "app_open" } = req.body;

        console.log(
            `[Guardian] Dev test triggered for ${req.user.id}: ${category} (${signal})`,
        );

        const result = await runGuardianAgent(req.user.id, category, signal);

        res.json({
            success: true,
            result,
            message: result
                ? `Guardian nudged: ${result.title}`
                : "Guardian decided no nudge needed",
        });
    } catch (error) {
        console.error("[Guardian] /test error:", error);
        res.status(500).json({ message: "Failed to trigger guardian", error: error.message });
    }
});

export default router;
