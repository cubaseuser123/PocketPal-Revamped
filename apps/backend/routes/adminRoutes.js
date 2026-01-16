import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Goal from "../models/Goal.js";
import Transaction from "../models/Transaction.js";
import Friend from "../models/Friend.js";
import UserBadge from "../models/UserBadge.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics
 *     security:
 *       - bearerAuth: []
 */
router.get("/stats", protect, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalTransactions,
      totalGoals,
      completedGoals,
      totalFriendships,
    ] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      Goal.countDocuments(),
      Goal.countDocuments({ isCompleted: true }),
      Friend.countDocuments({ status: "accepted" }),
    ]);

    // Recent signups (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({
      stats: {
        totalUsers,
        totalTransactions,
        totalGoals,
        completedGoals,
        goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        totalFriendships,
        recentSignups,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     security:
 *       - bearerAuth: []
 */
router.get("/users", protect, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select("name phone role level coins avatarUrl createdAt kycCompleted onboardingCompleted")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 */
router.get("/users/:id", protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get additional user data
    const [wallets, goals, badges, friendCount] = await Promise.all([
      Wallet.find({ userId: user._id }).lean(),
      Goal.find({ userId: user._id }).lean(),
      UserBadge.find({ userId: user._id }).lean(),
      Friend.countDocuments({
        status: "accepted",
        $or: [{ requester: user._id }, { recipient: user._id }],
      }),
    ]);

    res.json({
      user,
      wallets,
      goals,
      badges,
      friendCount,
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 */
router.delete("/users/:id", protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    // Delete all related data
    await Promise.all([
      Wallet.deleteMany({ userId: user._id }),
      Goal.deleteMany({ userId: user._id }),
      Transaction.deleteMany({ userId: user._id }),
      UserBadge.deleteMany({ userId: user._id }),
      Friend.deleteMany({
        $or: [{ requester: user._id }, { recipient: user._id }],
      }),
    ]);

    await User.deleteOne({ _id: user._id });

    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/v1/admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/users/:id/role", protect, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("name phone role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Role updated", user });
  } catch (error) {
    console.error("Admin update role error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
