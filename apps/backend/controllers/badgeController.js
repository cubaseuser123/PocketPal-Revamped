import UserBadge from "../models/UserBadge.js";
import { BADGES, getBadgeById } from "../models/Badge.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";

// Get all available badges
export const getAllBadges = async (req, res) => {
  try {
    res.json({ badges: BADGES });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get badges earned by current user
export const getUserBadges = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`[DEBUG] Fetching badges for user: ${userId}`);

    const earnedBadges = await UserBadge.find({ userId }).lean();
    console.log(`[DEBUG] Found ${earnedBadges.length} earned badges for user ${userId}`);
    const earnedBadgeIds = earnedBadges.map((b) => b.badgeId);

    // Combine all badges with earned status
    const badges = BADGES.map((badge) => {
      const earned = earnedBadges.find((eb) => eb.badgeId === badge.id);
      return {
        ...badge,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
      };
    });

    res.json({
      badges,
      earnedCount: earnedBadgeIds.length,
      totalCount: BADGES.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal function to award a badge (not an API endpoint)
export const awardBadge = async (userId, badgeId) => {
  try {
    const badge = getBadgeById(badgeId);
    if (!badge) {
      console.log(`Badge ${badgeId} not found`);
      return null;
    }

    // Check if already earned
    const existing = await UserBadge.findOne({ userId, badgeId });
    if (existing) {
      return null; // Already earned
    }

    const userBadge = await UserBadge.create({
      userId,
      badgeId,
      earnedAt: new Date(),
    });

    console.log(`🏆 Badge "${badge.name}" awarded to user ${userId}`);
    return { ...badge, earnedAt: userBadge.earnedAt };
  } catch (error) {
    console.error("Error awarding badge:", error);
    return null;
  }
};

// Check and award savings badges based on goals completed
export const checkSavingsBadges = async (userId, goalsCompleted) => {
  const awarded = [];

  if (goalsCompleted >= 1) {
    const badge = await awardBadge(userId, "goal_crusher");
    if (badge) awarded.push(badge);
  }
  if (goalsCompleted >= 5) {
    const badge = await awardBadge(userId, "super_saver");
    if (badge) awarded.push(badge);
  }
  if (goalsCompleted >= 10) {
    const badge = await awardBadge(userId, "savings_king");
    if (badge) awarded.push(badge);
  }

  return awarded;
};

// Check and award social badges based on friend count
export const checkSocialBadges = async (userId) => {
  const awarded = [];

  // Count accepted friendships
  const friendCount = await Friend.countDocuments({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  });

  if (friendCount >= 1) {
    const badge = await awardBadge(userId, "first_friend");
    if (badge) awarded.push(badge);
  }
  if (friendCount >= 5) {
    const badge = await awardBadge(userId, "social_butterfly");
    if (badge) awarded.push(badge);
  }

  return awarded;
};

// Check and award coin badges based on total coins
export const checkCoinBadges = async (userId, totalCoins) => {
  const awarded = [];

  if (totalCoins >= 100) {
    const badge = await awardBadge(userId, "coin_collector");
    if (badge) awarded.push(badge);
  }
  if (totalCoins >= 1000) {
    const badge = await awardBadge(userId, "coin_master");
    if (badge) awarded.push(badge);
  }

  return awarded;
};

// Check and award streak badges
export const checkStreakBadges = async (userId, streakDays) => {
  const awarded = [];

  if (streakDays >= 3) {
    const badge = await awardBadge(userId, "streak_starter");
    if (badge) awarded.push(badge);
  }
  if (streakDays >= 7) {
    const badge = await awardBadge(userId, "week_warrior");
    if (badge) awarded.push(badge);
  }

  return awarded;
};
