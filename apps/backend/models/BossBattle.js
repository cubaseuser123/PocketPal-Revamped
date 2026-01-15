import mongoose from "mongoose";

/**
 * Boss Battle - Global Event
 * All users fight the same boss. Damage is tracked per user for leaderboard.
 */

const leaderboardEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  damage: { type: Number, default: 0 },
}, { _id: false });

const bossBattleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    emoji: { type: String, default: "👾" },
    sidekickEmoji: { type: String }, // Optional sidekick emoji for the 3-emoji display
    
    // Health
    totalHealth: { type: Number, required: true },
    currentHealth: { type: Number, required: true },
    
    // Rewards on defeat
    rewards: {
      coins: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
    },
    
    // Boss status
    status: {
      type: String,
      enum: ["active", "defeated", "upcoming"],
      default: "upcoming",
    },
    
    // Leaderboard: tracks damage per user
    leaderboard: [leaderboardEntrySchema],
    
    // Timestamps for event duration
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true }
);

// Method to deal damage and update leaderboard
bossBattleSchema.methods.dealDamage = function(userId, amount) {
  if (this.status !== "active" || this.currentHealth <= 0) {
    return { success: false, message: "Boss is not active" };
  }

  // Update global health
  this.currentHealth = Math.max(0, this.currentHealth - amount);
  
  // Update leaderboard
  const entry = this.leaderboard.find(e => e.userId.toString() === userId.toString());
  if (entry) {
    entry.damage += amount;
  } else {
    this.leaderboard.push({ userId, damage: amount });
  }
  
  // Check if defeated
  if (this.currentHealth === 0) {
    this.status = "defeated";
  }
  
  return { success: true, currentHealth: this.currentHealth, defeated: this.currentHealth === 0 };
};

// Virtual for sorted leaderboard
bossBattleSchema.virtual("sortedLeaderboard").get(function() {
  return [...this.leaderboard].sort((a, b) => b.damage - a.damage);
});

bossBattleSchema.set("toJSON", { virtuals: true });
bossBattleSchema.set("toObject", { virtuals: true });

export default mongoose.model("BossBattle", bossBattleSchema);
