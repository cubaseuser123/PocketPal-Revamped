import mongoose from "mongoose";

/**
 * Friend Relationship Model
 * Handles friend requests and friendships between users
 */

const friendSchema = new mongoose.Schema(
  {
    requester: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    recipient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique relationships
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for efficient lookups
friendSchema.index({ recipient: 1, status: 1 });
friendSchema.index({ requester: 1, status: 1 });

export default mongoose.model("Friend", friendSchema);
