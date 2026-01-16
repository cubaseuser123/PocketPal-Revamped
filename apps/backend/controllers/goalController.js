import Goal from "../models/Goal.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { awardBadge, checkSavingsBadges } from "./badgeController.js";

// Get user's goals
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id })
      .sort({ isFeatured: -1, createdAt: -1 });

    return res.json({ goals });
  } catch (err) {
    console.error("getGoals error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Create a goal
export const createGoal = async (req, res) => {
  try {
    const { name, emoji, category, color, targetAmount, targetDate, isFeatured } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ message: "Name and target amount required" });
    }

    // If setting as featured, unset current featured
    if (isFeatured) {
      await Goal.updateMany(
        { userId: req.user.id, isFeatured: true },
        { isFeatured: false }
      );
    }

    const goal = await Goal.create({
      userId: req.user.id,
      name,
      emoji: emoji || "🎯",
      category: category || "General",
      color: color || "#FF8C32",
      targetAmount,
      targetDate,
      isFeatured: isFeatured || false,
    });

    // Award "first_saver" badge on first goal creation
    const awardedBadge = await awardBadge(req.user.id, "first_saver");

    return res.status(201).json({ 
      message: "Goal created", 
      goal,
      badgeAwarded: awardedBadge || null, // Return badge for toast notification
    });
  } catch (err) {
    console.error("createGoal error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update a goal
export const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emoji, category, color, targetAmount, targetDate, isFeatured } = req.body;

    const goal = await Goal.findOne({ _id: id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    // If setting as featured, unset current featured
    if (isFeatured && !goal.isFeatured) {
      await Goal.updateMany(
        { userId: req.user.id, isFeatured: true, _id: { $ne: id } },
        { isFeatured: false }
      );
    }

    if (name) goal.name = name;
    if (emoji) goal.emoji = emoji;
    if (category) goal.category = category;
    if (color) goal.color = color;
    if (targetAmount) goal.targetAmount = targetAmount;
    if (targetDate) goal.targetDate = targetDate;
    if (isFeatured !== undefined) goal.isFeatured = isFeatured;

    await goal.save();

    return res.json({ message: "Goal updated", goal });
  } catch (err) {
    console.error("updateGoal error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add money to a goal (from savings wallet)
export const addToGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const savingsWallet = await Wallet.findOne({ userId: req.user.id, type: "savings" });
    if (!savingsWallet || savingsWallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient savings balance" });
    }

    // Deduct from savings wallet
    savingsWallet.balance -= amount;
    await savingsWallet.save();

    // Add to goal
    goal.currentAmount += amount;
    let newlyCompleted = false;
    let badgesAwarded = [];
    if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      newlyCompleted = true;
    }
    await goal.save();

    // If goal just completed, check for badges
    if (newlyCompleted) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { totalGoalsCompleted: 1 } });
      const user = await User.findById(req.user.id);
      badgesAwarded = await checkSavingsBadges(req.user.id, user.totalGoalsCompleted);
    }

    // Create transaction
    await Transaction.create({
      userId: req.user.id,
      walletId: savingsWallet._id,
      name: `Saved to ${goal.name}`,
      emoji: goal.emoji,
      amount: -amount,
      type: "transfer",
    });

    return res.json({
      message: newlyCompleted ? "Goal completed!" : "Added to goal",
      goal,
      savingsBalance: savingsWallet.balance,
      goalCompleted: newlyCompleted,
      badgesAwarded: badgesAwarded.length > 0 ? badgesAwarded : null,
    });
  } catch (err) {
    console.error("addToGoal error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    return res.json({ message: "Goal deleted" });
  } catch (err) {
    console.error("deleteGoal error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
