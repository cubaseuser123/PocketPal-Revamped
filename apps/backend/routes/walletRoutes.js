import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getWallets,
  addMoney,
  transfer,
  upgradePpi,
} from "../controllers/walletController.js";

const router = express.Router();

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     tags: [Wallets]
 *     summary: Get user's wallets (primary & savings) with PPI info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balances and PPI limits
 */
router.get("/", protect, getWallets);

/**
 * @swagger
 * /api/wallets/add-money:
 *   post:
 *     tags: [Wallets]
 *     summary: Add money to primary wallet (respects PPI limits)
 *     security:
 *       - bearerAuth: []
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
router.post("/add-money", protect, addMoney);

/**
 * @swagger
 * /api/wallets/upgrade-ppi:
 *   post:
 *     tags: [Wallets]
 *     summary: Upgrade to Full KYC PPI (requires KYC completion)
 *     security:
 *       - bearerAuth: []
 */
router.post("/upgrade-ppi", protect, upgradePpi);

/**
 * @swagger
 * /api/wallets/transfer:
 *   post:
 *     tags: [Wallets]
 *     summary: Transfer between wallets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 enum: [primary, savings]
 *               to:
 *                 type: string
 *                 enum: [primary, savings]
 *               amount:
 *                 type: number
 */
router.post("/transfer", protect, transfer);

export default router;
