import Wallet, { PPI_LIMITS } from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Goal from "../models/Goal.js";

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
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user.id);
    const ppiType = user?.kycCompleted ? "full_kyc_ppi" : "small_ppi";
    
    let wallet = await Wallet.findOne({ userId: req.user.id, type: "primary" });
    
    if (!wallet) {
      wallet = await Wallet.create({ 
        userId: req.user.id, 
        type: "primary", 
        balance: 0,
        ppiType: ppiType,
        ppiId: `MOCK_PPI_${Date.now()}`,
      });
    }

    // Update PPI type if KYC was completed after wallet creation
    if (wallet.ppiType !== ppiType) {
      wallet.ppiType = ppiType;
    }

    // Check PPI limits
    const canLoadResult = wallet.canLoad(amount);
    if (!canLoadResult.allowed) {
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
      return res.status(400).json({ 
        message: `Per transaction limit ₹${limits.perTxnLimit} exceeded`,
        perTxnLimit: limits.perTxnLimit,
      });
    }

    wallet.balance += amount;
    wallet.monthlyLoaded += amount;
    await wallet.save();

    // Create transaction record
    await Transaction.create({
      userId: req.user.id,
      walletId: wallet._id,
      name: "Added money",
      emoji: "💵",
      amount: amount,
      type: "income",
    });

    return res.json({ 
      message: "Money added successfully", 
      balance: wallet.balance,
      ppiType: wallet.ppiType,
      remainingMonthlyLoad: wallet.remainingMonthlyLoad,
    });
  } catch (err) {
    console.error("addMoney error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
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
  try {
    const { from, to, amount } = req.body;
    
    if (!from || !to || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid transfer parameters" });
    }

    const user = await User.findById(req.user.id);
    const fromWallet = await Wallet.findOne({ userId: req.user.id, type: from });
    const toWallet = await Wallet.findOne({ userId: req.user.id, type: to });

    if (!fromWallet || !toWallet) {
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
        const goal = await Goal.findOne({ _id: sourceGoalId, userId: req.user.id });
        if (!goal) {
           return res.status(404).json({ message: "Source goal not found" });
        }

        if (goal.currentAmount < amount) {
           return res.status(400).json({ 
             message: `Insufficient funds in ${goal.name}. Available: ₹${goal.currentAmount}` 
           });
        }

        // Penalty check for THIS goal only
        if (!goal.isCompleted) {
          const coinCost = 10;
          if (user.coins < coinCost) {
            return res.status(400).json({ 
               message: `Early withdrawal from incomplete goal '${goal.name}' costs ${coinCost} coins. Balance: ${user.coins}`,
               coinsRequired: coinCost
            });
          }
          user.coins -= coinCost;
          coinsDeducted = coinCost;
          penalty = true;
          await user.save();
        }

        // Deduct from goal
        goal.currentAmount -= amount;
        await goal.save();

      } else {
        // CASE 2: Distribute deduction across ALL goals (Existing Logic)
        const goals = await Goal.find({ userId: req.user.id });
        const totalGoalAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
        const totalAvailable = fromWallet.balance + totalGoalAmount;

        if (totalAvailable < amount) {
          return res.status(400).json({ message: "Insufficient balance (Savings + Goals)" });
        }

        // Check for coin penalty (if ANY goal is incomplete)
        const incompleteGoals = goals.filter(g => !g.isCompleted);
        if (incompleteGoals.length > 0) {
          const coinCost = 10;
          if (user.coins < coinCost) {
            return res.status(400).json({ 
              message: `Early withdrawal costs ${coinCost} coins. You only have ${user.coins} coins.`,
              coinsRequired: coinCost,
              currentCoins: user.coins,
            });
          }
          user.coins -= coinCost;
          await user.save();
          coinsDeducted = coinCost;
          penalty = true;
        }

        let remainingToDeduct = amount;
        let deductedFromGoals = 0;
        
        // Single pass "best effort" distribution
        if (goals.length > 0) {
           // Sort by amount descending to take from biggest pots first? 
           // Or just raw loops. Let's do raw loop to match "equal" intent best we can.
           const share = amount / goals.length;
           
           for (const g of goals) {
              const deduction = Math.min(g.currentAmount, share); // Take share or whatever is available
              if (deduction > 0) {
                  g.currentAmount -= deduction;
                  remainingToDeduct -= deduction;
                  deductedFromGoals += deduction;
                  await g.save();
              }
           }
           
           // If first pass left remainder (due to small goals), take from others?
           // For simplicity and to avoid complexity, we take remainder from unallocated savings below.
           // Or we could loop again. Let's stick to unallocated fallback for now to prevent infinite loops.
        }

        // If we still need money (goals exhausted or capped by share), take from unallocated savings
        const stillNeeded = amount - deductedFromGoals;
        if (stillNeeded > 0) {
           if (fromWallet.balance < stillNeeded) {
               // Should be rare if total check passed, but possible due to share logic mismatch?
               // Actually if totalAvailable >= amount, this should be mathematically safe unless
               // we artificially limited goal deduction.
               // We should force take from goals if savings is empty?
               // Let's just deduct from savings. If negative, it means our "share" logic was too conservative.
               // Let's force valid state:
               let moreNeeded = stillNeeded - fromWallet.balance;
               fromWallet.balance = 0; // Take all savings
               
               for (const g of goals) {
                   if (moreNeeded <= 0) break;
                   const canTake = g.currentAmount; 
                   const taking = Math.min(canTake, moreNeeded);
                   g.currentAmount -= taking;
                   moreNeeded -= taking;
                   await g.save();
               }
           } else {
               fromWallet.balance -= stillNeeded;
           }
           await fromWallet.save();
        }
      } // Closes the `else` block for `sourceGoalId`

      toWallet.balance += amount;
      await toWallet.save();

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
      ]);

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
          return res.status(400).json({ message: "Insufficient balance" });
      }
      fromWallet.balance -= amount;
      toWallet.balance += amount;
      
      await fromWallet.save();
      await toWallet.save();
    
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
      ]);

      return res.json({
        message: "Transfer successful",
        from: { type: from, balance: fromWallet.balance },
        to: { type: to, balance: toWallet.balance },
      });
    }
  } catch (err) {
    console.error("transfer error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
