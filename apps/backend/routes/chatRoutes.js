import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { streamChat } from "../controllers/chatController.js";

const router = express.Router();

/**
 * POST /api/v1/chat
 * Stream a chat response from Pally AI
 *
 * Body: { messages: [{ role: "user"|"assistant", content: "..." }] }
 * Auth: Bearer token required
 */
router.post("/", protect, streamChat);

export default router;
