import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    
    // Profile
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    avatarUrl: { type: String, default: null },
    
    // Social
    friendCode: { type: String, unique: true, sparse: true },
    
    // Status
    kycCompleted: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingCompletedAt: { type: Date, default: null },
    
    // Savings Wheel
    lastSpinDate: { type: Date, default: null },
    
    // Stats for leaderboard
    totalGoalsCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Generate unique friend code before saving
userSchema.pre("save", async function(next) {
  if (!this.friendCode) {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate 6-character alphanumeric code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      // Check if code already exists
      const existing = await mongoose.models.User.findOne({ friendCode: code });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.friendCode = code;
  }
  next();
});

export default mongoose.model("User", userSchema);
