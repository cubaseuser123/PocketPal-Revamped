import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";

// Get user's transactions
export const getTransactions = async (req, res) => {
  try {
    const { limit = 20, offset = 0, walletType } = req.query;

    const query = { userId: req.user.id };
    
    // Filter by wallet type if specified
    if (walletType) {
      const wallet = await Wallet.findOne({ userId: req.user.id, type: walletType });
      if (wallet) {
        query.walletId = wallet._id;
      }
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate("categoryId", "name emoji color");

    const total = await Transaction.countDocuments(query);

    return res.json({
      transactions,
      total,
      hasMore: Number(offset) + transactions.length < total,
    });
  } catch (err) {
    console.error("getTransactions error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Create a transaction (expense)
export const createTransaction = async (req, res) => {
  try {
    const { name, emoji, amount, categoryId, note, walletType = "primary" } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ message: "Name and amount required" });
    }

    const wallet = await Wallet.findOne({ userId: req.user.id, type: walletType });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Check balance for expenses
    if (amount < 0 && wallet.balance < Math.abs(amount)) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Update wallet balance
    wallet.balance += amount;
    await wallet.save();

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      walletId: wallet._id,
      name,
      emoji: emoji || "💰",
      amount,
      categoryId,
      note,
      type: amount < 0 ? "expense" : "income",
    });

    return res.status(201).json({
      message: "Transaction created",
      transaction,
      newBalance: wallet.balance,
    });
  } catch (err) {
    console.error("createTransaction error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get spending summary
export const getSpendingSummary = async (req, res) => {
  try {
    const { period = "week" } = req.query;
    
    let startDate = new Date();
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "3m") {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    const transactions = await Transaction.find({
      userId: req.user.id,
      type: "expense",
      createdAt: { $gte: startDate },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    const avgPerDay = days > 0 ? Math.round(totalSpent / days) : 0;

    return res.json({
      period,
      totalSpent,
      avgPerDay,
      transactionCount: transactions.length,
    });
  } catch (err) {
    console.error("getSpendingSummary error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
