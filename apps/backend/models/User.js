import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    
    // Profile
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    avatarUrl: { type: String, default: null },
    
    // Status
    kycCompleted: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingCompletedAt: { type: Date, default: null },
    
    // Savings Wheel
    lastSpinDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
