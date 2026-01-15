import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getGoals,
  createGoal,
  updateGoal,
  addToGoal,
  deleteGoal,
} from "../controllers/goalController.js";

const router = express.Router();

/**
 * @swagger
 * /api/goals:
 *   get:
 *     tags: [Goals]
 *     summary: Get user's goals
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, getGoals);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     tags: [Goals]
 *     summary: Create a new goal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               emoji:
 *                 type: string
 *               category:
 *                 type: string
 *               color:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               isFeatured:
 *                 type: boolean
 */
router.post("/", protect, createGoal);

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     tags: [Goals]
 *     summary: Update a goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put("/:id", protect, updateGoal);

/**
 * @swagger
 * /api/goals/{id}/add:
 *   post:
 *     tags: [Goals]
 *     summary: Add money to a goal
 *     security:
 *       - bearerAuth: []
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
 *               amount:
 *                 type: number
 */
router.post("/:id/add", protect, addToGoal);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     tags: [Goals]
 *     summary: Delete a goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/:id", protect, deleteGoal);

export default router;
