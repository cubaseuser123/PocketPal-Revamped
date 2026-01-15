import Quest from "../models/Quest.js";
import User from "../models/User.js";

// Get quests assigned to current user
export const getMyQuests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const quests = await Quest.find({
      "assignedUsers.userId": userId,
      isActive: true,
    });
    
    // Map to include only user's progress
    const userQuests = quests.map(quest => {
      const userEntry = quest.assignedUsers.find(
        u => u.userId.toString() === userId.toString()
      );
      return {
        _id: quest._id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        requirement: quest.requirement,
        rewards: quest.rewards,
        difficulty: quest.difficulty,
        progress: userEntry?.progress || 0,
        completed: userEntry?.completed || false,
        expiresAt: quest.expiresAt,
      };
    });
    
    res.json(userQuests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign random quests to a user
export const assignRandomQuests = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = req.body.count || 3; // Default 3 quests
    
    // Find quests not already assigned to user
    const availableQuests = await Quest.find({
      isActive: true,
      "assignedUsers.userId": { $ne: userId },
    }).limit(count);
    
    for (const quest of availableQuests) {
      quest.assignToUser(userId);
      await quest.save();
    }
    
    res.json({ assigned: availableQuests.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quest progress
export const updateProgress = async (req, res) => {
  try {
    const { questId } = req.params;
    const { amount } = req.body;
    const userId = req.user._id;
    
    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({ message: "Quest not found" });
    }
    
    const result = quest.updateProgress(userId, amount);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    await quest.save();
    
    // If completed, award coins
    if (result.completed && result.rewards) {
      await User.findByIdAndUpdate(userId, {
        $inc: { coins: result.rewards.coins }
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new quest (admin)
export const createQuest = async (req, res) => {
  try {
    const quest = new Quest(req.body);
    await quest.save();
    res.status(201).json(quest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active quests (admin)
export const getAllQuests = async (req, res) => {
  try {
    const quests = await Quest.find({ isActive: true });
    res.json(quests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
