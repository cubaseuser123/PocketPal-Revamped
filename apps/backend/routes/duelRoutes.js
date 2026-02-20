import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createDuel,
  respondToDuel,
  getMyDuels,
  getDuelDetail,
  getDuelHistory,
} from "../controllers/duelController.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/duels:
 *   get:
 *     tags: [Duels]
 *     summary: Get active and pending duels
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, getMyDuels);

/**
 * @swagger
 * /api/v1/duels/history:
 *   get:
 *     tags: [Duels]
 *     summary: Get duel history and W/L record
 *     security:
 *       - bearerAuth: []
 */
router.get("/history", protect, getDuelHistory);

/**
 * @swagger
 * /api/v1/duels/{id}:
 *   get:
 *     tags: [Duels]
 *     summary: Get duel detail with live progress
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", protect, getDuelDetail);

/**
 * @swagger
 * /api/v1/duels:
 *   post:
 *     tags: [Duels]
 *     summary: Create a duel challenge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               challengedId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [most_saved, fewest_expenses, no_spend_streak]
 *               wager:
 *                 type: number
 *     security:
 *       - bearerAuth: []
 */
router.post("/", protect, createDuel);

/**
 * @swagger
 * /api/v1/duels/{id}/respond:
 *   post:
 *     tags: [Duels]
 *     summary: Accept or decline a duel
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, decline]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/respond", protect, respondToDuel);

export default router;
