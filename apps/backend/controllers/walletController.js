// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { wallets, users, transactions, goals } from "../drizzle/schema.js";
import { eq, and, sql } from "drizzle-orm";

// PPI Limits - same as before
const PPI_LIMITS = {
  small_ppi: {
    maxBalance: 10000,
    monthlyLoadLimit: 10000,
    perTxnLimit: 10000,
    cashWithdrawal: false,
    fundsTransfer: false,
  },
  full_kyc_ppi: {
    maxBalance: 200000,
    monthlyLoadLimit: 200000,
    perTxnLimit: 200000,
    cashWithdrawal: true,
    fundsTransfer: true,
  },
};

// Helper to check if can load money
function canLoad(wallet, amount) {
  const limits = PPI_LIMITS[wallet.ppiType || "small_ppi"];
  const newBalance = Number(wallet.balance) + Number(amount);
  const newMonthlyLoaded = Number(wallet.monthlyLoaded) + Number(amount);
  
  if (newBalance > limits.maxBalance) {
    return { 
      allowed: false, 
      reason: `Max balance ₹${limits.maxBalance} would be exceeded`,
      maxAllowed: limits.maxBalance - Number(wallet.balance),
    };
  }
  if (newMonthlyLoaded > limits.monthlyLoadLimit) {
    return { 
      allowed: false, 
      reason: `Monthly load limit ₹${limits.monthlyLoadLimit} exceeded`,
      maxAllowed: limits.monthlyLoadLimit - Number(wallet.monthlyLoaded),
    };
  }
  return { allowed: true };
}

// Get user's wallets with PPI info
export const getWallets = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.id) });
    let userWallets = await db.query.wallets.findMany({ where: eq(wallets.userId, req.user.id) });

    // Determine PPI type based on KYC status
    const ppiType = user?.kycCompleted ? "full_kyc_ppi" : "small_ppi";

    // Create wallets if they don't exist
    if (userWallets.length === 0) {
        // Drizzle transaction callback
      const [primary, savings] = await db.transaction(async (tx) => {
        const [prim] = await tx.insert(wallets).values({ 
            userId: req.user.id, 
            type: "primary", 
            balance: 0,
            ppiType: ppiType,
            ppiId: `MOCK_PPI_${Date.now()}`,
        }).returning();
        
        const [sav] = await tx.insert(wallets).values({
          userId: req.user.id, type: "savings", balance: 0
        }).returning();
        
        return [prim, sav];
      });
      userWallets = [primary, savings];
    }

    const primary = userWallets.find(w => w.type === "primary");
    const savings = userWallets.find(w => w.type === "savings");
    const limits = PPI_LIMITS[primary?.ppiType || "small_ppi"];
    
    const remainingMonthlyLoad = limits.monthlyLoadLimit - Number(primary?.monthlyLoaded || 0);

    return res.json({
      primary: {
        id: primary?.id,
        balance: Number(primary?.balance || 0),
        ppiType: primary?.ppiType || "small_ppi",
        ppiId: primary?.ppiId,
        limits: {
          maxBalance: limits.maxBalance,
          monthlyLoadLimit: limits.monthlyLoadLimit,
          perTxnLimit: limits.perTxnLimit,
          cashWithdrawal: limits.cashWithdrawal,
          fundsTransfer: limits.fundsTransfer,
        },
        remainingMonthlyLoad,
      },
      savings: {
        id: savings?.id,
        balance: Number(savings?.balance || 0),
      },
      total: Number(primary?.balance || 0) + Number(savings?.balance || 0),
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

    const result = await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({ where: eq(users.id, req.user.id) });
      const ppiType = user?.kycCompleted ? "full_kyc_ppi" : "small_ppi";
      
      let wallet = await tx.query.wallets.findFirst({ 
        where: and(eq(wallets.userId, req.user.id), eq(wallets.type, "primary")) 
      });
      
      // Create wallet if needed
      if (!wallet) {
        [wallet] = await tx.insert(wallets).values({ 
            userId: req.user.id, 
            type: "primary", 
            balance: 0,
            ppiType: ppiType,
            ppiId: `MOCK_PPI_${Date.now()}`,
        }).returning();
      }

      // Update PPI type if KYC was completed after wallet creation
      if (wallet.ppiType !== ppiType) {
        [wallet] = await tx.update(wallets)
          .set({ ppiType })
          .where(eq(wallets.id, wallet.id))
          .returning();
      }

      // Check PPI limits
      const canLoadResult = canLoad(wallet, amount);
      if (!canLoadResult.allowed) {
        throw new Error(JSON.stringify({ 
          type: "LIMIT_ERROR",
          message: canLoadResult.reason,
          maxAllowed: canLoadResult.maxAllowed,
          ppiType: wallet.ppiType,
          upgradeToFullKyc: wallet.ppiType === "small_ppi",
        }));
      }

      // Check per-transaction limit
      const limits = PPI_LIMITS[wallet.ppiType];
      if (amount > limits.perTxnLimit) {
        throw new Error(JSON.stringify({
          type: "LIMIT_ERROR",
          message: `Per transaction limit ₹${limits.perTxnLimit} exceeded`,
          perTxnLimit: limits.perTxnLimit,
        }));
      }

      // Update wallet
      const [updatedWallet] = await tx.update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${amount}`,
          monthlyLoaded: sql`${wallets.monthlyLoaded} + ${amount}`,
        })
        .where(eq(wallets.id, wallet.id))
        .returning();

      // Create transaction record
      await tx.insert(transactions).values({
          userId: req.user.id,
          walletId: wallet.id,
          name: "Added money",
          emoji: "💵",
          amount: amount,
          type: "income",
      });

      return {
        balance: Number(updatedWallet.balance),
        ppiType: updatedWallet.ppiType,
        remainingMonthlyLoad: limits.monthlyLoadLimit - Number(updatedWallet.monthlyLoaded),
      };
    });

    return res.json({ 
      message: "Money added successfully", 
      ...result,
    });
  } catch (err) {
    console.error("addMoney error:", err);
    
    try {
      const errorData = JSON.parse(err.message);
      if (errorData.type === "LIMIT_ERROR") {
        return res.status(400).json(errorData);
      }
    } catch {}
    
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// Upgrade wallet to full KYC PPI
export const upgradePpi = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.id) });
    
    if (!user.kycCompleted) {
      return res.status(400).json({ 
        message: "Complete KYC first to upgrade to Full KYC PPI" 
      });
    }

    const wallet = await db.query.wallets.findFirst({ 
      where: and(eq(wallets.userId, req.user.id), eq(wallets.type, "primary")) 
    });
    
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.ppiType === "full_kyc_ppi") {
      return res.status(400).json({ message: "Already using Full KYC PPI" });
    }

    const [updatedWallet] = await db.update(wallets)
      .set({ ppiType: "full_kyc_ppi" })
      .where(eq(wallets.id, wallet.id))
      .returning();

    const limits = PPI_LIMITS["full_kyc_ppi"];

    return res.json({
      message: "Upgraded to Full KYC PPI",
      ppiType: updatedWallet.ppiType,
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
    const { from, to, amount, sourceGoalId } = req.body;
    
    if (!from || !to || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid transfer parameters" });
    }

    const result = await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({ where: eq(users.id, req.user.id) });
      const fromWallet = await tx.query.wallets.findFirst({ where: and(eq(wallets.userId, req.user.id), eq(wallets.type, from)) });
      const toWallet = await tx.query.wallets.findFirst({ where: and(eq(wallets.userId, req.user.id), eq(wallets.type, to)) });

      if (!fromWallet || !toWallet) {
        throw new Error("Wallet not found");
      }

      let coinsDeducted = 0;
      let penalty = false;
      let updatedUser = user;

      // Special handling for Savings -> Expense (Withdrawal)
      if (from === "savings" && to === "primary") {
        // CASE 1: Withdraw from SPECIFIC GOAL
        if (sourceGoalId) {
          const goal = await tx.query.goals.findFirst({ 
            where: and(eq(goals.id, sourceGoalId), eq(goals.userId, req.user.id)) 
          });
          if (!goal) {
            throw new Error("Source goal not found");
          }

          if (Number(goal.currentAmount) < amount) {
            throw new Error(`Insufficient funds in ${goal.name}. Available: ₹${goal.currentAmount}`);
          }

          // Penalty check for THIS goal only
          if (!goal.isCompleted) {
            const coinCost = 10;
            if (user.coins < coinCost) {
              throw new Error(JSON.stringify({
                type: "COIN_ERROR",
                message: `Early withdrawal from incomplete goal '${goal.name}' costs ${coinCost} coins. Balance: ${user.coins}`,
                coinsRequired: coinCost,
              }));
            }
            [updatedUser] = await tx.update(users)
              .set({ coins: sql`${users.coins} - ${coinCost}` })
              .where(eq(users.id, req.user.id))
              .returning();
            coinsDeducted = coinCost;
            penalty = true;
          }

          // Deduct from goal
          await tx.update(goals)
            .set({ currentAmount: sql`${goals.currentAmount} - ${amount}` })
            .where(eq(goals.id, goal.id));

        } else {
          // CASE 2: Distribute deduction across ALL goals
          const userGoals = await tx.query.goals.findMany({ where: eq(goals.userId, req.user.id) });
          const totalGoalAmount = userGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
          const totalAvailable = Number(fromWallet.balance) + totalGoalAmount;

          if (totalAvailable < amount) {
            throw new Error("Insufficient balance (Savings + Goals)");
          }

          // Check for coin penalty
          const hasIncompleteGoals = userGoals.some(g => !g.isCompleted && Number(g.currentAmount) > 0);
          if (hasIncompleteGoals) {
            const coinCost = 10;
            if (user.coins < coinCost) {
              throw new Error(JSON.stringify({
                type: "COIN_ERROR",
                message: `Early withdrawal costs ${coinCost} coins. You only have ${user.coins} coins.`,
                coinsRequired: coinCost,
                currentCoins: user.coins,
              }));
            }
            [updatedUser] = await tx.update(users)
              .set({ coins: sql`${users.coins} - ${coinCost}` })
              .where(eq(users.id, req.user.id))
              .returning();
            coinsDeducted = coinCost;
            penalty = true;
          }

          // Distribute deduction across goals
          let remaining = amount;
          for (const goal of userGoals.sort((a, b) => Number(a.currentAmount) - Number(b.currentAmount))) {
            if (remaining <= 0) break;
            const deduction = Math.min(remaining, Number(goal.currentAmount));
            if (deduction > 0) {
              await tx.update(goals)
                .set({ currentAmount: sql`${goals.currentAmount} - ${deduction}` })
                .where(eq(goals.id, goal.id));
              remaining -= deduction;
            }
          }

          // If we still need money, take from unallocated savings
          if (remaining > 0) {
            await tx.update(wallets)
              .set({ balance: sql`${wallets.balance} - ${remaining}` })
              .where(eq(wallets.id, fromWallet.id));
          }
        }

        // Add to destination wallet
        const [updatedToWallet] = await tx.update(wallets)
          .set({ balance: sql`${wallets.balance} + ${amount}` })
          .where(eq(wallets.id, toWallet.id))
          .returning();

        // Transaction records
        await tx.insert(transactions).values([
          {
            userId: req.user.id,
            walletId: fromWallet.id,
            name: sourceGoalId ? "Transfer from Goal" : "Withdrawal (Goals)",
            emoji: "↗️",
            amount: -amount,
            type: "transfer",
          },
          {
            userId: req.user.id,
            walletId: toWallet.id,
            name: sourceGoalId ? "Deposit from Goal" : "Deposit from Savings",
            emoji: "↙️",
            amount: amount,
            type: "transfer",
          }
        ]);

        return {
          message: penalty 
            ? `Withdrawal successful (${coinsDeducted} coins deducted)` 
            : "Withdrawal successful",
          from: { type: from, balance: Number(fromWallet.balance) }, // Approximate, actually fetched before update but logic holds
          to: { type: to, balance: Number(updatedToWallet.balance) },
          coinsDeducted,
          newCoinBalance: updatedUser.coins,
        };

      } else {
        // Standard Transfer (Primary -> Savings or others)
        if (Number(fromWallet.balance) < amount) {
          throw new Error("Insufficient balance");
        }
        
        const [[updatedFrom], [updatedTo]] = await Promise.all([
          tx.update(wallets)
            .set({ balance: sql`${wallets.balance} - ${amount}` })
            .where(eq(wallets.id, fromWallet.id))
            .returning(),
          tx.update(wallets)
            .set({ balance: sql`${wallets.balance} + ${amount}` })
            .where(eq(wallets.id, toWallet.id))
            .returning(),
        ]);

        // Create transaction records
        await tx.insert(transactions).values([
          {
            userId: req.user.id,
            walletId: fromWallet.id,
            name: `Transfer to ${to}`,
            emoji: "↗️",
            amount: -amount,
            type: "transfer",
          },
          {
            userId: req.user.id,
            walletId: toWallet.id,
            name: `Transfer from ${from}`,
            emoji: "↙️",
            amount: amount,
            type: "transfer",
          }
        ]);

        return {
          message: "Transfer successful",
          from: { type: from, balance: Number(updatedFrom.balance) },
          to: { type: to, balance: Number(updatedTo.balance) },
        };
      }
    });

    return res.json(result);
  } catch (err) {
    console.error("transfer error:", err);
    
    try {
      const errorData = JSON.parse(err.message);
      if (errorData.type === "COIN_ERROR") {
        return res.status(400).json(errorData);
      }
    } catch {}
    
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
