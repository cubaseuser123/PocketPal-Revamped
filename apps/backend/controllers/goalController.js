// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { goals, wallets, transactions, users } from "../drizzle/schema.js";
import { eq, desc, and, ne, sql } from "drizzle-orm";
import { awardBadge, checkSavingsBadges } from "./badgeController.js";

// Get user's goals
export const getGoals = async (req, res) => {
  try {
    const userGoals = await db.query.goals.findMany({
      where: eq(goals.userId, req.user.id),
      orderBy: [desc(goals.isFeatured), desc(goals.createdAt)],
    });

    return res.json({ 
      goals: userGoals.map(g => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        progress: Number(g.targetAmount) > 0 ? Number(g.currentAmount) / Number(g.targetAmount) : 0,
      })),
    });
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
        // update matches where userId = user.id AND isFeatured = true
      await db.update(goals)
        .set({ isFeatured: false })
        .where(and(eq(goals.userId, req.user.id), eq(goals.isFeatured, true)));
    }

    const [goal] = await db.insert(goals).values({
        userId: req.user.id,
        name,
        emoji: emoji || "🎯",
        category: category || "General",
        color: color || "#FF8C32",
        targetAmount,
        targetDate: targetDate ? new Date(targetDate) : null,
        isFeatured: isFeatured || false,
    }).returning();

    // Award "first_saver" badge on first goal creation
    const awardedBadge = await awardBadge(req.user.id, "first_saver");

    return res.status(201).json({ 
      message: "Goal created", 
      goal: { 
        ...goal, 
        targetAmount: Number(goal.targetAmount), 
        currentAmount: Number(goal.currentAmount),
        progress: Number(goal.targetAmount) > 0 ? Number(goal.currentAmount) / Number(goal.targetAmount) : 0
      },
      badgeAwarded: awardedBadge || null,
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

    const goal = await db.query.goals.findFirst({ 
      where: and(eq(goals.id, id), eq(goals.userId, req.user.id)) 
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    // If setting as featured, unset current featured
    if (isFeatured && !goal.isFeatured) {
      await db.update(goals)
        .set({ isFeatured: false })
        .where(and(
            eq(goals.userId, req.user.id), 
            eq(goals.isFeatured, true),
            ne(goals.id, id)
        ));
    }

    const [updatedGoal] = await db.update(goals)
      .set({
        ...(name && { name }),
        ...(emoji && { emoji }),
        ...(category && { category }),
        ...(color && { color }),
        ...(targetAmount && { targetAmount }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(isFeatured !== undefined && { isFeatured }),
      })
      .where(eq(goals.id, id))
      .returning();

    return res.json({ 
      message: "Goal updated", 
      goal: { 
        ...updatedGoal, 
        targetAmount: Number(updatedGoal.targetAmount), 
        currentAmount: Number(updatedGoal.currentAmount),
        progress: Number(updatedGoal.targetAmount) > 0 ? Number(updatedGoal.currentAmount) / Number(updatedGoal.targetAmount) : 0
      },
    });
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

    const result = await db.transaction(async (tx) => {
      const goal = await tx.query.goals.findFirst({ 
        where: and(eq(goals.id, id), eq(goals.userId, req.user.id)) 
      });
      if (!goal) {
        throw new Error("Goal not found");
      }

      const savingsWallet = await tx.query.wallets.findFirst({ 
        where: and(eq(wallets.userId, req.user.id), eq(wallets.type, "savings")) 
      });
      
      if (!savingsWallet || Number(savingsWallet.balance) < amount) {
        throw new Error("Insufficient savings balance");
      }

      // Deduct from savings wallet
      const [updatedWallet] = await tx.update(wallets)
        .set({ balance: sql`${wallets.balance} - ${amount}` })
        .where(eq(wallets.id, savingsWallet.id))
        .returning();

      // Add to goal
      const newAmount = Number(goal.currentAmount) + amount;
      const isNowComplete = newAmount >= Number(goal.targetAmount) && !goal.isCompleted;
      
      const [updatedGoal] = await tx.update(goals)
        .set({
            currentAmount: sql`${goals.currentAmount} + ${amount}`,
            ...(isNowComplete && { isCompleted: true }),
        })
        .where(eq(goals.id, goal.id))
        .returning();

      // Create transaction
      await tx.insert(transactions).values({
          userId: req.user.id,
          walletId: savingsWallet.id,
          name: `Saved to ${goal.name}`,
          emoji: goal.emoji,
          amount: -amount,
          type: "transfer",
      });

      return {
        goal: updatedGoal,
        savingsBalance: Number(updatedWallet.balance),
        newlyCompleted: isNowComplete,
      };
    });

    // If goal just completed, update user stats and check badges
    let badgesAwarded = [];
    if (result.newlyCompleted) {
      const [updatedUser] = await db.update(users)
        .set({ totalGoalsCompleted: sql`${users.totalGoalsCompleted} + 1` })
        .where(eq(users.id, req.user.id))
        .returning();
        
      badgesAwarded = await checkSavingsBadges(req.user.id, updatedUser.totalGoalsCompleted);
    }

    return res.json({
      message: result.newlyCompleted ? "Goal completed!" : "Added to goal",
      goal: { 
        ...result.goal, 
        targetAmount: Number(result.goal.targetAmount), 
        currentAmount: Number(result.goal.currentAmount),
        progress: Number(result.goal.targetAmount) > 0 ? Number(result.goal.currentAmount) / Number(result.goal.targetAmount) : 0
      },
      savingsBalance: result.savingsBalance,
      goalCompleted: result.newlyCompleted,
      badgesAwarded: badgesAwarded.length > 0 ? badgesAwarded : null,
    });
  } catch (err) {
    console.error("addToGoal error:", err);
    if (err.message === "Goal not found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === "Insufficient savings balance") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await db.query.goals.findFirst({ 
      where: and(eq(goals.id, id), eq(goals.userId, req.user.id)) 
    });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    await db.delete(goals).where(eq(goals.id, id));

    return res.json({ message: "Goal deleted" });
  } catch (err) {
    console.error("deleteGoal error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
