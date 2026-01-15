import Wallet, { PPI_LIMITS } from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

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

    const fromWallet = await Wallet.findOne({ userId: req.user.id, type: from });
    const toWallet = await Wallet.findOne({ userId: req.user.id, type: to });

    if (!fromWallet || !toWallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (fromWallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Check funds transfer allowed for primary wallet (Small PPI doesn't allow)
    if (from === "primary" && fromWallet.ppiType === "small_ppi") {
      const limits = PPI_LIMITS["small_ppi"];
      if (!limits.fundsTransfer) {
        return res.status(400).json({ 
          message: "Fund transfers require Full KYC. Complete KYC to enable.",
          upgradeToFullKyc: true,
        });
      }
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
  } catch (err) {
    console.error("transfer error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
