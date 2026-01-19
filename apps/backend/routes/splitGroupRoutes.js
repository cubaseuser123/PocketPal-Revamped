import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createGroup,
  listUserGroups,
  getGroupDetails,
  settleExpense
} from "../controllers/splitGroupController.js";

const router = express.Router();

router.post("/", protect, createGroup);
router.get("/", protect, listUserGroups);
router.get("/:id", protect, getGroupDetails);
router.post("/:id/pay", protect, settleExpense);

export default router;
