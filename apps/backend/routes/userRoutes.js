import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  completeOnboarding,
  completeKyc,
  uploadAvatar,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// Multer Config with security enhancements
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    // Sanitize filename: remove special characters, keep only alphanumeric and extension
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, sanitizedName);
  },
});

// Allowed file types
const ALLOWED_TYPES = /jpg|jpeg|png|webp/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function checkFileType(file, cb) {
  const extname = ALLOWED_TYPES.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = /image\/(jpeg|jpg|png|webp)/.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

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

/**
 * @swagger
 * /api/user/avatar:
 *   post:
 *     tags: [User]
 *     summary: Upload profile picture
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         description: The file to upload.
 *     security:
 *       - bearerAuth: []
 */
router.post("/avatar", protect, upload.single("image"), uploadAvatar);

/**
 * @swagger
 * /api/user/me:
 *   delete:
 *     tags: [User]
 *     summary: Delete user account
 *     security:
 *       - bearerAuth: []
 */
router.delete("/me", protect, deleteUser);

export default router;
