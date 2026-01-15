import mongoose from "mongoose";

/**
 * Quest - Randomly assigned challenges
 * One quest can be assigned to multiple users.
 */

const questSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    
    // Quest type/category
    type: {
      type: String,
      enum: ["savings", "spending", "streak", "social", "special"],
      default: "savings",
    },
    
    // Requirement to complete (e.g., "save 100 rupees")
    requirement: {
      action: { type: String }, // e.g., "save", "transfer", "streak"
      target: { type: Number }, // e.g., 100 (rupees or count)
    },
    
    // Rewards
    rewards: {
      coins: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
    },
    
    // Difficulty
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    
    // Users assigned to this quest
    assignedUsers: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      progress: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
    }],
    
    // Quest availability
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Method to assign quest to a user
questSchema.methods.assignToUser = function(userId) {
  const existing = this.assignedUsers.find(u => u.userId.toString() === userId.toString());
  if (!existing) {
    this.assignedUsers.push({ userId, progress: 0, completed: false });
    return true;
  }
  return false; // Already assigned
};

// Method to update user progress
questSchema.methods.updateProgress = function(userId, amount) {
  const userEntry = this.assignedUsers.find(u => u.userId.toString() === userId.toString());
  if (!userEntry) return { success: false, message: "User not assigned" };
  
  userEntry.progress += amount;
  
  // Check completion
  if (this.requirement && userEntry.progress >= this.requirement.target) {
    userEntry.completed = true;
    userEntry.completedAt = new Date();
    return { success: true, completed: true, rewards: this.rewards };
  }
  
  return { success: true, completed: false, progress: userEntry.progress };
};

export default mongoose.model("Quest", questSchema);
