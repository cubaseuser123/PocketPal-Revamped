// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { quests, questAssignments, users } from "../drizzle/schema.js";
import { eq, and, notInArray, sql } from "drizzle-orm";

// Get quests assigned to current user
export const getMyQuests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const assignments = await db.query.questAssignments.findMany({
      where: eq(questAssignments.userId, userId),
      with: {
        quest: true,
      },
    });
    
    // Filter active quests and map
    const userQuests = assignments
      .filter(a => a.quest.isActive)
      .map(a => ({
        id: a.quest.id,
        title: a.quest.title,
        description: a.quest.description,
        type: a.quest.type,
        requirementAction: a.quest.requirementAction,
        requirementTarget: a.quest.requirementTarget,
        rewardCoins: Number(a.quest.rewardCoins),
        rewardXp: Number(a.quest.rewardXp),
        difficulty: a.quest.difficulty,
        progress: Number(a.progress),
        completed: a.completed,
        expiresAt: a.quest.expiresAt,
      }));
    
    res.json(userQuests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign random quests to a user
export const assignRandomQuests = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = req.body.count || 3;
    
    // Find quests not already assigned to user
    const existingAssignments = await db.query.questAssignments.findMany({
      where: eq(questAssignments.userId, userId),
    });
    const assignedQuestIds = existingAssignments.map(a => a.questId);
    
    let availableQuests;
    if (assignedQuestIds.length > 0) {
        availableQuests = await db.query.quests.findMany({
            where: and(
                eq(quests.isActive, true),
                notInArray(quests.id, assignedQuestIds)
            ),
            limit: count,
        });
    } else {
        availableQuests = await db.query.quests.findMany({
            where: eq(quests.isActive, true),
            limit: count,
        });
    }
    
    // Shuffle and pick? Drizzle `limit` just picks first N. 
    // Prisma `take` also picks first N unless ordered randomly or skipped. 
    // The simplified version here just picks N.
    
    for (const quest of availableQuests) {
      await db.insert(questAssignments).values({
          questId: quest.id,
          userId,
          progress: 0,
          completed: false,
      });
    }
    
    res.json({ assigned: availableQuests.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update progress
export const updateProgress = async (req, res) => {
  try {
    const { questId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;
    
    const assignment = await db.query.questAssignments.findFirst({
      where: and(
          eq(questAssignments.questId, questId),
          eq(questAssignments.userId, userId)
      ),
      with: { quest: true },
    });
    
    if (!assignment) {
      return res.status(404).json({ message: "Quest not assigned to you" });
    }
    
    if (assignment.completed) {
      return res.status(400).json({ message: "Quest already completed" });
    }
    
    const newProgress = Number(assignment.progress) + amount;
    const target = Number(assignment.quest.requirementTarget) || 1;
    const completed = newProgress >= target;
    
    await db.update(questAssignments)
      .set({
        progress: newProgress,
        completed,
        ...(completed && { completedAt: new Date() }),
      })
      .where(eq(questAssignments.id, assignment.id));
    
    // If completed, award coins
    let rewards = null;
    if (completed) {
      const rewardCoins = Number(assignment.quest.rewardCoins) || 0;
      if (rewardCoins > 0) {
        await db.update(users)
            .set({ coins: sql`${users.coins} + ${rewardCoins}` })
            .where(eq(users.id, userId));
        rewards = { coins: rewardCoins };
      }
    }
    
    res.json({
      success: true,
      progress: newProgress,
      completed,
      rewards,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new quest (admin)
export const createQuest = async (req, res) => {
  try {
    const { title, description, type, requirementAction, requirementTarget, rewardCoins, rewardXp, difficulty, expiresAt } = req.body;
    
    const [quest] = await db.insert(quests).values({
        title,
        description,
        type: type || "savings",
        requirementAction,
        requirementTarget,
        rewardCoins: rewardCoins || 0,
        rewardXp: rewardXp || 0,
        difficulty: difficulty || "easy",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true // defaulted in schema? schema says default true? Let's assume schema defaults.
        // Actually schema has default(true).
    }).returning();
    
    res.status(201).json(quest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active quests (admin)
export const getAllQuests = async (req, res) => {
  try {
    const allQuests = await db.query.quests.findMany({
      where: eq(quests.isActive, true),
    });
    res.json(allQuests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
