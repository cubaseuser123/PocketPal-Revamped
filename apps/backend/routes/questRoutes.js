import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyQuests,
  assignRandomQuests,
  updateProgress,
  createQuest,
  getAllQuests,
} from "../controllers/questController.js";

const router = express.Router();

// User routes
router.get("/my", protect, getMyQuests);
router.post("/assign", protect, assignRandomQuests);
router.patch("/:questId/progress", protect, updateProgress);

// Admin routes
router.post("/", protect, createQuest);
router.get("/", protect, getAllQuests);

export default router;
