import Goal from "../models/Goal.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

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

    return res.status(201).json({ message: "Goal created", goal });
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
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    await goal.save();

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
      message: "Added to goal",
      goal,
      savingsBalance: savingsWallet.balance,
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
