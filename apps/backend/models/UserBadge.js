import mongoose from "mongoose";

/**
 * UserBadge - Tracks badges earned by users
 */

const userBadgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    badgeId: {
      type: String,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to ensure user can't earn same badge twice
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export default mongoose.model("UserBadge", userBadgeSchema);
