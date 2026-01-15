import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    emoji: { type: String, required: true },
    color: { type: String, default: "#FF8C32" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Seed default categories
categorySchema.statics.seedDefaults = async function () {
  const defaults = [
    { name: "Food", emoji: "🍕", color: "#EF4444", isDefault: true },
    { name: "Travel", emoji: "🚌", color: "#3B82F6", isDefault: true },
    { name: "Shopping", emoji: "🛍️", color: "#8B5CF6", isDefault: true },
    { name: "Entertainment", emoji: "🎮", color: "#10B981", isDefault: true },
    { name: "Bills", emoji: "📄", color: "#F59E0B", isDefault: true },
    { name: "Health", emoji: "💊", color: "#EC4899", isDefault: true },
    { name: "Education", emoji: "📚", color: "#6366F1", isDefault: true },
    { name: "Other", emoji: "💰", color: "#6B7280", isDefault: true },
  ];

  for (const cat of defaults) {
    await this.findOneAndUpdate(
      { name: cat.name },
      cat,
      { upsert: true, new: true }
    );
  }
  console.log("✅ Default categories seeded");
};

export default mongoose.model("Category", categorySchema);
