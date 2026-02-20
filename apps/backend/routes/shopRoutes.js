import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getShopItems,
  purchaseItem,
  getMyPurchases,
} from "../controllers/shopController.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/shop:
 *   get:
 *     tags: [Shop]
 *     summary: Get all active shop items grouped by category
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, getShopItems);

/**
 * @swagger
 * /api/v1/shop/purchases:
 *   get:
 *     tags: [Shop]
 *     summary: Get user's purchase history
 *     security:
 *       - bearerAuth: []
 */
router.get("/purchases", protect, getMyPurchases);

/**
 * @swagger
 * /api/v1/shop/purchase/{itemId}:
 *   post:
 *     tags: [Shop]
 *     summary: Purchase a shop item
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 */
router.post("/purchase/:itemId", protect, purchaseItem);

export default router;
