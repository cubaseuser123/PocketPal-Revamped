import BossBattle from "../models/BossBattle.js";
import User from "../models/User.js";

// Get current active boss battle
export const getActiveBoss = async (req, res) => {
  try {
    const boss = await BossBattle.findOne({ status: "active" })
      .populate("leaderboard.userId", "name avatarUrl");
    
    if (!boss) {
      return res.status(404).json({ message: "No active boss battle" });
    }
    
    res.json({
      ...boss.toJSON(),
      leaderboard: boss.sortedLeaderboard.slice(0, 10), // Top 10
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leaderboard for a boss
export const getLeaderboard = async (req, res) => {
  try {
    const { bossId } = req.params;
    const boss = await BossBattle.findById(bossId)
      .populate("leaderboard.userId", "name avatarUrl");
    
    if (!boss) {
      return res.status(404).json({ message: "Boss not found" });
    }
    
    res.json(boss.sortedLeaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deal damage to boss
export const dealDamage = async (req, res) => {
  try {
    const { bossId } = req.params;
    let { amount } = req.body;
    const userId = req.user._id;

    // Security: Cap damage to prevent cheating
    const MAX_DAMAGE_PER_HIT = 100;
    if (amount > MAX_DAMAGE_PER_HIT) {
      amount = MAX_DAMAGE_PER_HIT;
    }
    
    const boss = await BossBattle.findById(bossId);
    if (!boss) {
      return res.status(404).json({ message: "Boss not found" });
    }
    
    const result = boss.dealDamage(userId, amount);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    await boss.save();
    
    // If defeated, award coins to participants
    if (result.defeated) {
      const rewards = boss.rewards;
      
      // Bulk update for all participants
      const participantIds = boss.leaderboard.map(entry => entry.userId);
      if (participantIds.length > 0 && rewards.coins > 0) {
        await User.updateMany(
            { _id: { $in: participantIds } },
            { $inc: { coins: rewards.coins } }
        );
      }
    }
    
    res.json({
      currentHealth: result.currentHealth,
      defeated: result.defeated,
      message: result.defeated ? "Boss defeated! Rewards distributed." : "Damage dealt!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new boss battle (admin)
export const createBoss = async (req, res) => {
  try {
    const { name, description, imageUrl, totalHealth, rewards, startsAt, endsAt } = req.body;
    
    const boss = new BossBattle({
      name,
      description,
      imageUrl,
      totalHealth,
      currentHealth: totalHealth,
      rewards,
      status: "upcoming",
      startsAt,
      endsAt,
    });
    
    await boss.save();
    res.status(201).json(boss);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate a boss battle
export const activateBoss = async (req, res) => {
  try {
    const { bossId } = req.params;
    
    // Deactivate any currently active boss
    await BossBattle.updateMany({ status: "active" }, { status: "defeated" });
    
    const boss = await BossBattle.findByIdAndUpdate(
      bossId,
      { status: "active" },
      { new: true }
    );
    
    res.json(boss);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
