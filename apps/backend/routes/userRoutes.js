import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  completeOnboarding,
  completeKyc,
} from "../controllers/userController.js";

const router = express.Router();

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     tags: [User]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with wallets
 */
router.get("/me", protect, getProfile);

/**
 * @swagger
 * /api/user/me:
 *   put:
 *     tags: [User]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 */
router.put("/me", protect, updateProfile);

/**
 * @swagger
 * /api/user/complete-onboarding:
 *   post:
 *     tags: [User]
 *     summary: Mark onboarding as complete
 *     security:
 *       - bearerAuth: []
 */
router.post("/complete-onboarding", protect, completeOnboarding);

/**
 * @swagger
 * /api/user/complete-kyc:
 *   post:
 *     tags: [User]
 *     summary: Mark KYC as complete
 *     security:
 *       - bearerAuth: []
 */
router.post("/complete-kyc", protect, completeKyc);

export default router;
