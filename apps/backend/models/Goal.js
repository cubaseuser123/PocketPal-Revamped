import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    name: { type: String, required: true },
    emoji: { type: String, default: "🎯" },
    category: { type: String, default: "General" },
    color: { type: String, default: "#FF8C32" },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    targetDate: { type: Date },
  },
  { timestamps: true }
);

// Index for user's goals
goalSchema.index({ userId: 1, isFeatured: -1 });

// Virtual for progress percentage
goalSchema.virtual("progress").get(function () {
  return this.targetAmount > 0 ? this.currentAmount / this.targetAmount : 0;
});

// Ensure virtuals are included in JSON output
goalSchema.set("toJSON", { virtuals: true });
goalSchema.set("toObject", { virtuals: true });

export default mongoose.model("Goal", goalSchema);
