import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      default: "general",
    },

    startDate: {
      type: Date,
      required: true,
    },

    nextRenewal: {
      type: Date,
      required: true,
    },

    renewalCycle: {
      type: String,
      enum: ["monthly", "yearly", "weekly"],
      default: "monthly",
    },

    status: {
      type: String,
      enum: ["active", "upcoming", "cancelled"],
      default: "active",
    },

    isReminderOn: {
      type: Boolean,
      default: true,
    },

    roundOffAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
