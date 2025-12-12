import express from "express";
import {
  addSubscription,
  getAllSubscriptions,
  getActiveSubscriptions,
  getUpcomingSubscriptions,
  getCancelledSubscriptions,
  cancelSubscription,
} from "../controllers/subscriptionController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Manage user subscriptions
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Subscription:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         nextRenewal:
 *           type: string
 *           format: date
 *         renewalCycle:
 *           type: string
 *         status:
 *           type: string
 *         roundOffAmount:
 *           type: number
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /api/subscriptions/add:
 *   post:
 *     summary: Add a new subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               renewalCycle:
 *                 type: string
 *                 enum: [monthly, yearly, weekly]
 *     responses:
 *       201:
 *         description: Subscription added successfully
 */
router.post("/add", protect, addSubscription);

/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: Get all subscriptions of logged-in user
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", protect, getAllSubscriptions);

/**
 * @swagger
 * /api/subscriptions/active:
 *   get:
 *     summary: Get active subscriptions
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/active", protect, getActiveSubscriptions);

/**
 * @swagger
 * /api/subscriptions/upcoming:
 *   get:
 *     summary: Get upcoming subscriptions
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/upcoming", protect, getUpcomingSubscriptions);

/**
 * @swagger
 * /api/subscriptions/cancelled:
 *   get:
 *     summary: Get cancelled subscriptions
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/cancelled", protect, getCancelledSubscriptions);

/**
 * @swagger
 * /api/subscriptions/cancel/{id}:
 *   put:
 *     summary: Cancel a specific subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
router.put("/cancel/:id", protect, cancelSubscription);

export default router;
