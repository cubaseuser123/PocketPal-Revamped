// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { friends, users } from "../drizzle/schema.js";
import { eq, or, and, inArray, desc } from "drizzle-orm";
import { checkSocialBadges } from "./badgeController.js";

// Send friend request by friend code
export const sendRequest = async (req, res) => {
  try {
    const { friendCode } = req.body;
    const requesterId = req.user.id;

    if (!friendCode) {
      return res.status(400).json({ message: "Friend code is required" });
    }

    // Find user by friend code
    const recipient = await db.query.users.findFirst({ 
      where: eq(users.friendCode, friendCode.toUpperCase())
    });
    if (!recipient) {
      return res.status(404).json({ message: "User not found with this code" });
    }

    // Can't add yourself
    if (recipient.id === requesterId) {
      return res.status(400).json({ message: "You cannot add yourself as a friend" });
    }

    // Check if relationship already exists
    const existing = await db.query.friends.findFirst({
      where: or(
          and(eq(friends.requesterId, requesterId), eq(friends.recipientId, recipient.id)),
          and(eq(friends.requesterId, recipient.id), eq(friends.recipientId, requesterId))
      ),
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "You are already friends" });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ message: "Friend request already pending" });
      }
    }

    // Create friend request
    const [friendRequest] = await db.insert(friends).values({
        requesterId,
        recipientId: recipient.id,
        status: "pending",
    }).returning();

    res.status(201).json({ 
      message: "Friend request sent",
      request: friendRequest,
    });
  } catch (error) {
    console.error("sendRequest error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Accept friend request
export const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await db.query.friends.findFirst({ where: eq(friends.id, id) });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only recipient can accept
    if (request.recipientId !== userId) {
      return res.status(403).json({ message: "You cannot accept this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    await db.update(friends)
      .set({ status: "accepted" })
      .where(eq(friends.id, id));

    // Check for social badges for both users
    await checkSocialBadges(request.requesterId);
    await checkSocialBadges(request.recipientId);

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("acceptRequest error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reject friend request
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await db.query.friends.findFirst({ where: eq(friends.id, id) });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only recipient can reject
    if (request.recipientId !== userId) {
      return res.status(403).json({ message: "You cannot reject this request" });
    }

    await db.update(friends)
      .set({ status: "rejected" })
      .where(eq(friends.id, id));

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("rejectRequest error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const friendship = await db.query.friends.findFirst({
      where: and(
        eq(friends.id, id),
        eq(friends.status, "accepted"),
        or(eq(friends.requesterId, userId), eq(friends.recipientId, userId))
      ),
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    await db.delete(friends).where(eq(friends.id, id));

    res.json({ message: "Friend removed" });
  } catch (error) {
    console.error("removeFriend error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all friends
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendships = await db.query.friends.findMany({
      where: and(
        eq(friends.status, "accepted"),
        or(eq(friends.requesterId, userId), eq(friends.recipientId, userId))
      ),
      with: {
        user_requesterId: true, // Use relation keys from schema.js
        user_recipientId: true,
      }
    });

    // Extract friend data (the other person in each relationship)
    const friendList = friendships.map((f) => {
      // f.user_requesterId corresponds to f.requesterId
      // f.user_recipientId corresponds to f.recipientId
      
      const friend = f.requesterId === userId ? f.user_recipientId : f.user_requesterId;
      
      // Select specific fields manually since Drizzle "select" in with is not supported in simplified query builder without advanced usage
      // We can just filter fields here
      return {
        friendshipId: f.id,
        id: friend.id,
        name: friend.name,
        avatarUrl: friend.avatarUrl,
        level: friend.level,
        coins: friend.coins,
        friendCode: friend.friendCode,
        totalGoalsCompleted: friend.totalGoalsCompleted,
      };
    });

    res.json({ friends: friendList });
  } catch (error) {
    console.error("getFriends error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await db.query.friends.findMany({
      where: and(
        eq(friends.recipientId, userId),
        eq(friends.status, "pending")
      ),
      with: {
        user_requesterId: true
      }
    });

    res.json({ 
      requests: requests.map(r => ({
        id: r.id,
        from: {
            name: r.user_requesterId.name,
            avatarUrl: r.user_requesterId.avatarUrl,
            level: r.user_requesterId.level
        },
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("getPendingRequests error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get friends leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "coins" } = req.params; // "coins" or "goals"

    // Get user's friends
    const friendships = await db.query.friends.findMany({
      where: and(
        eq(friends.status, "accepted"),
        or(eq(friends.requesterId, userId), eq(friends.recipientId, userId))
      ),
    });

    // Extract friend IDs
    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.recipientId : f.requesterId
    );

    // Add current user to the list
    friendIds.push(userId);

    // Get users sorted by the specified metric
    const sortField = type === "goals" ? users.totalGoalsCompleted : users.coins;
    
    // Check if friendIds is empty? It always has userId.
    
    const leaderboardUsers = await db.query.users.findMany({
      where: inArray(users.id, friendIds),
      orderBy: [desc(sortField)],
    });

    // Add rank
    const leaderboard = leaderboardUsers.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      level: user.level,
      coins: user.coins,
      totalGoalsCompleted: user.totalGoalsCompleted,
      isCurrentUser: user.id === userId,
    }));

    res.json({ leaderboard, type });
  } catch (error) {
    console.error("getLeaderboard error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
