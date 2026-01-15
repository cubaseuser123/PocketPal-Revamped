import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTransactions,
  createTransaction,
  getSpendingSummary,
} from "../controllers/transactionController.js";

const router = express.Router();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get user's transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: walletType
 *         schema:
 *           type: string
 *           enum: [primary, savings]
 */
router.get("/", protect, getTransactions);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a transaction
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
 *               amount:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               walletType:
 *                 type: string
 */
router.post("/", protect, createTransaction);

/**
 * @swagger
 * /api/transactions/summary:
 *   get:
 *     tags: [Transactions]
 *     summary: Get spending summary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, 3m]
 *           default: week
 */
router.get("/summary", protect, getSpendingSummary);

export default router;
