import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getLeaderboard,
} from "../controllers/friendController.js";

const router = express.Router();

/**
 * @swagger
 * /api/friends:
 *   get:
 *     tags: [Friends]
 *     summary: Get all friends
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, getFriends);

/**
 * @swagger
 * /api/friends/pending:
 *   get:
 *     tags: [Friends]
 *     summary: Get pending friend requests
 *     security:
 *       - bearerAuth: []
 */
router.get("/pending", protect, getPendingRequests);

/**
 * @swagger
 * /api/friends/leaderboard/{type}:
 *   get:
 *     tags: [Friends]
 *     summary: Get friends leaderboard
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *           enum: [coins, goals]
 *         description: Type of leaderboard
 *     security:
 *       - bearerAuth: []
 */
router.get("/leaderboard/:type", protect, getLeaderboard);

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     tags: [Friends]
 *     summary: Send friend request by code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendCode:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 */
router.post("/request", protect, sendRequest);

/**
 * @swagger
 * /api/friends/accept/{id}:
 *   post:
 *     tags: [Friends]
 *     summary: Accept friend request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 */
router.post("/accept/:id", protect, acceptRequest);

/**
 * @swagger
 * /api/friends/reject/{id}:
 *   post:
 *     tags: [Friends]
 *     summary: Reject friend request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 */
router.post("/reject/:id", protect, rejectRequest);

/**
 * @swagger
 * /api/friends/{id}:
 *   delete:
 *     tags: [Friends]
 *     summary: Remove friend
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", protect, removeFriend);

export default router;
