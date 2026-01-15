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
} from "../controllers/userController.js";

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Images only!");
  }
}

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

export default router;
