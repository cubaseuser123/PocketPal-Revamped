import express from "express";
import { sendOTP, verifyOTP, logoutUser, getMe } from "../controllers/authUser.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: sample
 *               email:
 *                 type: string
 *                 example: sample@gmail.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 */
router.post("/send-otp", sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP sent to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: sample@gmail.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified, returns token and user
 */
router.post("/verify-otp", verifyOTP);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get logged-in user's details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   example:
 *                     name: "sample"
 *                     email: "sample@gmail.com"
 */

router.get("/me", (req, res, next) => {
  next();
}, protect, getMe);


router.post("/logout", logoutUser);

export default router;
