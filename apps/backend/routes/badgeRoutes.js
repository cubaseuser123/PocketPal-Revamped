import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getAllBadges, getUserBadges } from "../controllers/badgeController.js";

const router = express.Router();

/**
 * @swagger
 * /api/badges:
 *   get:
 *     tags: [Badges]
 *     summary: Get all available badges
 */
router.get("/", getAllBadges);

/**
 * @swagger
 * /api/badges/me:
 *   get:
 *     tags: [Badges]
 *     summary: Get current user's badges with earned status
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", protect, getUserBadges);

export default router;
