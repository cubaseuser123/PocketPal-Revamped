import mongoose from "mongoose";

const splitExpenseSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'SplitGroup', required: true },
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The one who paid the merchant (e.g., Creator)
  ower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // The one who owes money
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  transactionId: { type: String } // Link to the settlement transaction
}, { timestamps: true });

export default mongoose.model("SplitExpense", splitExpenseSchema);
