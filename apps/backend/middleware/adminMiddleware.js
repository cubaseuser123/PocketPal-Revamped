import { protect } from "./authMiddleware.js";
import User from "../models/User.js";

// Admin middleware - must be used AFTER protect middleware
export const requireAdmin = async (req, res, next) => {
  try {
    // User should already be attached by protect middleware
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
