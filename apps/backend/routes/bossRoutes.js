import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getActiveBoss,
  getLeaderboard,
  dealDamage,
  createBoss,
  activateBoss,
} from "../controllers/bossController.js";

const router = express.Router();

// Public/User routes
router.get("/active", protect, getActiveBoss);
router.get("/:bossId/leaderboard", protect, getLeaderboard);
router.post("/:bossId/damage", protect, dealDamage);

// Admin routes (add admin middleware if needed)
router.post("/", protect, createBoss);
router.patch("/:bossId/activate", protect, activateBoss);

export default router;
