import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    walletId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Wallet", 
      required: true 
    },
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Category" 
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SplitGroup"
    },
    name: { type: String, required: true },
    emoji: { type: String, default: "💰" },
    amount: { type: Number, required: true }, // Negative for expense, positive for income
    type: { 
      type: String, 
      enum: ["expense", "income", "transfer"], 
      required: true 
    },
    note: { type: String },
  },
  { timestamps: true }
);

// Index for efficient querying by user and date
transactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Transaction", transactionSchema);
