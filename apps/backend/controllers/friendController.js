import Friend from "../models/Friend.js";
import User from "../models/User.js";

// Send friend request by friend code
export const sendRequest = async (req, res) => {
  try {
    const { friendCode } = req.body;
    const requesterId = req.user._id;

    if (!friendCode) {
      return res.status(400).json({ message: "Friend code is required" });
    }

    // Find user by friend code
    const recipient = await User.findOne({ friendCode: friendCode.toUpperCase() });
    if (!recipient) {
      return res.status(404).json({ message: "User not found with this code" });
    }

    // Can't add yourself
    if (recipient._id.toString() === requesterId.toString()) {
      return res.status(400).json({ message: "You cannot add yourself as a friend" });
    }

    // Check if relationship already exists
    const existing = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipient._id },
        { requester: recipient._id, recipient: requesterId },
      ],
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
    const friendRequest = await Friend.create({
      requester: requesterId,
      recipient: recipient._id,
      status: "pending",
    });

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
    const userId = req.user._id;

    const request = await Friend.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only recipient can accept
    if (request.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You cannot accept this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    request.status = "accepted";
    await request.save();

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
    const userId = req.user._id;

    const request = await Friend.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only recipient can reject
    if (request.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You cannot reject this request" });
    }

    request.status = "rejected";
    await request.save();

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
    const userId = req.user._id;

    const friendship = await Friend.findOne({
      _id: id,
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    await Friend.deleteOne({ _id: id });

    res.json({ message: "Friend removed" });
  } catch (error) {
    console.error("removeFriend error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all friends
export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate("requester", "name avatarUrl level coins friendCode totalGoalsCompleted")
      .populate("recipient", "name avatarUrl level coins friendCode totalGoalsCompleted");

    // Extract friend data (the other person in each relationship)
    const friends = friendships.map((f) => {
      const friend = f.requester._id.toString() === userId.toString() 
        ? f.recipient 
        : f.requester;
      return {
        friendshipId: f._id,
        ...friend.toObject(),
      };
    });

    res.json({ friends });
  } catch (error) {
    console.error("getFriends error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await Friend.find({
      recipient: userId,
      status: "pending",
    }).populate("requester", "name avatarUrl level");

    res.json({ 
      requests: requests.map(r => ({
        id: r._id,
        from: r.requester,
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
    const userId = req.user._id;
    const { type = "coins" } = req.params; // "coins" or "goals"

    // Get user's friends
    const friendships = await Friend.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    });

    // Extract friend IDs
    const friendIds = friendships.map((f) =>
      f.requester.toString() === userId.toString() ? f.recipient : f.requester
    );

    // Add current user to the list
    friendIds.push(userId);

    // Get users sorted by the specified metric
    const sortField = type === "goals" ? "totalGoalsCompleted" : "coins";
    const users = await User.find({ _id: { $in: friendIds } })
      .select("name avatarUrl level coins totalGoalsCompleted")
      .sort({ [sortField]: -1 });

    // Add rank
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user.toObject(),
      isCurrentUser: user._id.toString() === userId.toString(),
    }));

    res.json({ leaderboard, type });
  } catch (error) {
    console.error("getLeaderboard error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
