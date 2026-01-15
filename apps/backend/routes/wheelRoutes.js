import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getWheelStatus, spinWheel } from "../controllers/wheelController.js";

const router = express.Router();

router.get("/status", protect, getWheelStatus);
router.post("/spin", protect, spinWheel);

export default router;
