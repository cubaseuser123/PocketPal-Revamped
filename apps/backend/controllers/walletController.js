import mongoose from "mongoose";
import Wallet, { PPI_LIMITS } from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Goal from "../models/Goal.js";
import TransferService from "../services/TransferService.js";

// Get user's wallets with PPI info
export const getWallets = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let wallets = await Wallet.find({ userId: req.user.id });

    // Determine PPI type based on KYC status
    const ppiType = user?.kycCompleted ? "full_kyc_ppi" : "small_ppi";

    // Create wallets if they don't exist
    if (wallets.length === 0) {
      wallets = await Wallet.create([
        { 
          userId: req.user.id, 
          type: "primary", 
          balance: 0,
          ppiType: ppiType,
          ppiId: `MOCK_PPI_${Date.now()}`,
        },
        { userId: req.user.id, type: "savings", balance: 0 },
      ]);
    }

    const primary = wallets.find(w => w.type === "primary");
    const savings = wallets.find(w => w.type === "savings");
    const limits = PPI_LIMITS[primary?.ppiType || "small_ppi"];

    return res.json({
      primary: {
        id: primary?._id,
        balance: primary?.balance || 0,
        ppiType: primary?.ppiType || "small_ppi",
        ppiId: primary?.ppiId,
        limits: {
          maxBalance: limits.maxBalance,
          monthlyLoadLimit: limits.monthlyLoadLimit,
          perTxnLimit: limits.perTxnLimit,
          cashWithdrawal: limits.cashWithdrawal,
          fundsTransfer: limits.fundsTransfer,
        },
        remainingMonthlyLoad: primary?.remainingMonthlyLoad,
      },
      savings: {
        id: savings?._id,
        balance: savings?.balance || 0,
      },
      total: (primary?.balance || 0) + (savings?.balance || 0),
      kycCompleted: user?.kycCompleted || false,
    });
  } catch (err) {
    console.error("getWallets error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add money to primary wallet (with PPI limit checks)
export const addMoney = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const user = await User.findById(req.user.id).session(session);
    const ppiType = user?.kycCompleted ? "full_kyc_ppi" : "small_ppi";
    
    let wallet = await Wallet.findOne({ userId: req.user.id, type: "primary" }).session(session);
    
    // Create wallet if needed (rare case in flows, but handled)
    if (!wallet) {
      // Create options require array for session support in create ([doc], { session })
      const [newWallet] = await Wallet.create([{ 
        userId: req.user.id, 
        type: "primary", 
        balance: 0,
        ppiType: ppiType,
        ppiId: `MOCK_PPI_${Date.now()}`,
      }], { session });
      wallet = newWallet;
    }

    // Update PPI type if KYC was completed after wallet creation
    if (wallet.ppiType !== ppiType) {
      wallet.ppiType = ppiType;
    }

    // Check PPI limits
    const canLoadResult = wallet.canLoad(amount);
    if (!canLoadResult.allowed) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: canLoadResult.reason,
        maxAllowed: canLoadResult.maxAllowed,
        ppiType: wallet.ppiType,
        upgradeToFullKyc: wallet.ppiType === "small_ppi",
      });
    }

    // Check per-transaction limit
    const limits = PPI_LIMITS[wallet.ppiType];
    if (amount > limits.perTxnLimit) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: `Per transaction limit ₹${limits.perTxnLimit} exceeded`,
        perTxnLimit: limits.perTxnLimit,
      });
    }

    wallet.balance += amount;
    wallet.monthlyLoaded += amount;
    await wallet.save({ session });

    // Create transaction record
    await Transaction.create([{
      userId: req.user.id,
      walletId: wallet._id,
      name: "Added money",
      emoji: "💵",
      amount: amount,
      type: "income",
    }], { session });

    await session.commitTransaction();

    return res.json({ 
      message: "Money added successfully", 
      balance: wallet.balance,
      ppiType: wallet.ppiType,
      remainingMonthlyLoad: wallet.remainingMonthlyLoad,
    });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("addMoney error:", err);
    return res.status(500).json({ message: err.message || "Server error" }); // Return generic error unless specific message
  } finally {
    session.endSession();
  }
};

// Upgrade wallet to full KYC PPI
export const upgradePpi = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.kycCompleted) {
      return res.status(400).json({ 
        message: "Complete KYC first to upgrade to Full KYC PPI" 
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user.id, type: "primary" });
    
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.ppiType === "full_kyc_ppi") {
      return res.status(400).json({ message: "Already using Full KYC PPI" });
    }

    wallet.ppiType = "full_kyc_ppi";
    await wallet.save();

    const limits = PPI_LIMITS["full_kyc_ppi"];

    return res.json({
      message: "Upgraded to Full KYC PPI",
      ppiType: wallet.ppiType,
      limits: {
        maxBalance: limits.maxBalance,
        monthlyLoadLimit: limits.monthlyLoadLimit,
        perTxnLimit: limits.perTxnLimit,
        cashWithdrawal: limits.cashWithdrawal,
        fundsTransfer: limits.fundsTransfer,
      },
    });
  } catch (err) {
    console.error("upgradePpi error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Transfer between wallets
export const transfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { from, to, amount } = req.body;
    
    if (!from || !to || !amount || amount <= 0) {
      throw new Error("Invalid transfer parameters");
    }

    const user = await User.findById(req.user.id).session(session);
    const fromWallet = await Wallet.findOne({ userId: req.user.id, type: from }).session(session);
    const toWallet = await Wallet.findOne({ userId: req.user.id, type: to }).session(session);

    if (!fromWallet || !toWallet) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Transfer logic
    // Special handling for Savings -> Expense (Withdrawal)
    if (from === "savings" && to === "primary") {
      const { sourceGoalId } = req.body; // Optional: withdraw from specific goal

      let coinsDeducted = 0;
      let penalty = false;

      // CASE 1: Withdraw from SPECIFIC GOAL
      if (sourceGoalId) {
        const goal = await Goal.findOne({ _id: sourceGoalId, userId: req.user.id }).session(session);
        if (!goal) {
           await session.abortTransaction();
           return res.status(404).json({ message: "Source goal not found" });
        }

        if (goal.currentAmount < amount) {
           await session.abortTransaction();
           return res.status(400).json({ 
             message: `Insufficient funds in ${goal.name}. Available: ₹${goal.currentAmount}` 
           });
        }

        // Penalty check for THIS goal only
        if (!goal.isCompleted) {
          const coinCost = 10;
          if (user.coins < coinCost) {
            await session.abortTransaction();
            return res.status(400).json({ 
               message: `Early withdrawal from incomplete goal '${goal.name}' costs ${coinCost} coins. Balance: ${user.coins}`,
               coinsRequired: coinCost
            });
          }
          user.coins -= coinCost;
          coinsDeducted = coinCost;
          penalty = true;
          await user.save({ session });
        }

        // Deduct from goal
        goal.currentAmount -= amount;
        await goal.save({ session });

      } else {
        // CASE 2: Distribute deduction across ALL goals
        const goals = await Goal.find({ userId: req.user.id }).session(session);
        const totalGoalAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
        const totalAvailable = fromWallet.balance + totalGoalAmount;

        if (totalAvailable < amount) {
          await session.abortTransaction();
          return res.status(400).json({ message: "Insufficient balance (Savings + Goals)" });
        }

        // Check for coin penalty using Service
        if (TransferService.shouldApplyPenalty(goals)) {
          const coinCost = 10;
          if (user.coins < coinCost) {
             await session.abortTransaction();
             return res.status(400).json({ 
               message: `Early withdrawal costs ${coinCost} coins. You only have ${user.coins} coins.`,
               coinsRequired: coinCost,
               currentCoins: user.coins,
             });
          }
           user.coins -= coinCost;
           await user.save({ session });
           coinsDeducted = coinCost;
           penalty = true;
        }

        // Use Service for distribution
        const { goalsToUpdate, remaining } = TransferService.calculateGoalDistribution(amount, goals);
        
        for (const update of goalsToUpdate) {
             update.goal.currentAmount -= update.deduction;
             await update.goal.save({ session });
        }

        // If we still need money (goals exhausted), take from unallocated savings
        if (remaining > 0) {
            // Note: totalAvailable check ensures this logic holds, checking balance anyway for safety
            if (fromWallet.balance < remaining) {
                // This shouldn't theoretically happen if totalAvailable check passed, but strictly safe
                await session.abortTransaction();
                return res.status(400).json({ message: "Calculation error: insufficient funds during distribution" });
            }
            fromWallet.balance -= remaining;
            await fromWallet.save({ session });
        }
      } // Closes the `else` block for `sourceGoalId`

      toWallet.balance += amount;
      await toWallet.save({ session });

      // Transaction records...
      await Transaction.create([
        {
          userId: req.user.id,
          walletId: fromWallet._id,
          name: sourceGoalId ? "Transfer from Goal" : (from === "savings" ? "Withdrawal (Goals)" : `Transfer to ${to}`),
          emoji: "↗️",
          amount: -amount,
          type: "transfer",
        },
        {
          userId: req.user.id,
          walletId: toWallet._id,
          name: sourceGoalId ? "Deposit from Goal" : (from === "savings" ? "Deposit from Savings" : `Transfer from ${from}`),
          emoji: "↙️",
          amount: amount,
          type: "transfer",
        },
      ], { session });
      
      await session.commitTransaction();

      return res.json({
        message: penalty 
          ? `Withdrawal successful (${coinsDeducted} coins deducted)` 
          : "Withdrawal successful",
        from: { type: from, balance: fromWallet.balance },
        to: { type: to, balance: toWallet.balance },
        coinsDeducted,
        newCoinBalance: user.coins,
      });

    } else {
      // Standard Transfer (Primary -> Savings or others)
      if (fromWallet.balance < amount) {
          await session.abortTransaction();
          return res.status(400).json({ message: "Insufficient balance" });
      }
      fromWallet.balance -= amount;
      toWallet.balance += amount;
      
      await fromWallet.save({ session });
      await toWallet.save({ session });
    
      // Create transaction records
      await Transaction.create([
        {
          userId: req.user.id,
          walletId: fromWallet._id,
          name: `Transfer to ${to}`,
          emoji: "↗️",
          amount: -amount,
          type: "transfer",
        },
        {
          userId: req.user.id,
          walletId: toWallet._id,
          name: `Transfer from ${from}`,
          emoji: "↙️",
          amount: amount,
          type: "transfer",
        },
      ], { session, ordered: true });

      await session.commitTransaction();

      return res.json({
        message: "Transfer successful",
        from: { type: from, balance: fromWallet.balance },
        to: { type: to, balance: toWallet.balance },
      });
    }
  } catch (err) {
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
    console.error("transfer error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  } finally {
    session.endSession();
  }
};
