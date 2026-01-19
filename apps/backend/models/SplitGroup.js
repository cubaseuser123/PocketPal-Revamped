import mongoose from "mongoose";

const splitGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['active', 'settled'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("SplitGroup", splitGroupSchema);
