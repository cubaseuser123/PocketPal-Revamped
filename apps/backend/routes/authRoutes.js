import express from "express";
import { body, validationResult } from "express-validator";
import { sendOTP, verifyOTP, logoutUser, getMe } from "../controllers/authUser.js";
import { protect } from "../middleware/authMiddleware.js";
import { otpLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Input validation rules
const sendOtpValidation = [
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone is required")
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage("Invalid phone number format"),
  body("name")
    .optional()
    .trim()
    .escape(), // Sanitize to prevent XSS
];

const verifyOtpValidation = [
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone is required")
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage("Invalid phone number format"),
  body("otp")
    .trim()
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
    .isNumeric().withMessage("OTP must contain only numbers"),
];

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to user's phone via SMS
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *     responses:
 *       200:
 *         description: OTP sent to phone
 */
router.post("/send-otp", otpLimiter, sendOtpValidation, handleValidationErrors, sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP sent to phone
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified, returns token and user
 */
router.post("/verify-otp", otpLimiter, verifyOtpValidation, handleValidationErrors, verifyOTP);

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
 *                     name: "Rahul"
 *                     phone: "+919876543210"
 */

router.get("/me", (req, res, next) => {
  next();
}, protect, getMe);


router.post("/logout", logoutUser);

export default router;
