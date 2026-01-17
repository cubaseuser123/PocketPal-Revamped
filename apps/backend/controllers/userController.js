import User from "../models/User.js";
import Wallet from "../models/Wallet.js";

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure friend code exists (lazy migration for existing users)
    if (!user.friendCode) {
       let code;
       let unique = false;
       while(!unique) {
          code = Math.random().toString(36).substring(2, 8).toUpperCase();
          const exists = await User.findOne({ friendCode: code });
          if(!exists) unique = true;
       }
       user.friendCode = code;
       await user.save();
    }

    // Get user's wallets
    const wallets = await Wallet.find({ userId: user._id });
    const primaryWallet = wallets.find(w => w.type === "primary");
    const savingsWallet = wallets.find(w => w.type === "savings");

    // Check if onboarding should be shown again (> 30 days since completion)
    let shouldShowOnboarding = !user.onboardingCompleted;
    if (user.onboardingCompleted && user.onboardingCompletedAt) {
      const daysSinceOnboarding = (Date.now() - new Date(user.onboardingCompletedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceOnboarding > 30) {
        shouldShowOnboarding = true;
      }
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        level: user.level,
        coins: user.coins,
        avatarUrl: user.avatarUrl,
        kycCompleted: user.kycCompleted,
        onboardingCompleted: !shouldShowOnboarding, // Return false if should show again
        friendCode: user.friendCode,
      },
      wallets: {
        primary: primaryWallet?.balance || 0,
        savings: savingsWallet?.balance || 0,
      },
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    
    await user.save();
    
    return res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Complete onboarding
export const completeOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.onboardingCompleted = true;
    user.onboardingCompletedAt = new Date();
    
    // Award coins for completing onboarding
    user.coins = (user.coins || 0) + 20;
    
    await user.save();

    const { amount } = req.body;
    const initialBalance = amount ? parseInt(amount) : 0;

    // Create or Get wallets
    let primaryWallet;
    const existingWallets = await Wallet.find({ userId: user._id });
    
    if (existingWallets.length === 0) {
        const newWallets = await Wallet.create([
            { userId: user._id, type: "primary", balance: initialBalance },
            { userId: user._id, type: "savings", balance: 0 },
        ]);
        primaryWallet = newWallets.find(w => w.type === "primary");
    } else {
        primaryWallet = existingWallets.find(w => w.type === "primary");
        if (primaryWallet && initialBalance > 0) {
            // Edge case: Wallet exists but user is re-onboarding with money
            primaryWallet.balance += initialBalance;
            await primaryWallet.save();
        }
    }

    // Create Initial Transaction if amount > 0
    if (initialBalance > 0 && primaryWallet) {
        const Transaction = (await import("../models/Transaction.js")).default;
        await Transaction.create({
            userId: user._id,
            walletId: primaryWallet._id,
            amount: initialBalance,
            type: "income", // Money coming IN
            category: null, // Initial deposit might not have a category or we can look it up if needed, but schema allows ref/null? 
                            // Schema says categoryId is ref "Category", not required. 
                            // But name is required. Keep "Initial Deposit".
            name: "Initial Deposit",
            emoji: "💰",
            status: "completed",
            date: new Date()
        });
    }

    return res.json({ 
      message: "Onboarding completed", 
      coins: user.coins,
      user 
    });
  } catch (err) {
    console.error("completeOnboarding error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Complete KYC
export const completeKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.kycCompleted) {
      return res.status(400).json({ message: "KYC already completed" });
    }

    user.kycCompleted = true;
    
    // Award 100 XP/Coins for KYC
    user.coins = (user.coins || 0) + 100;
    
    await user.save();

    return res.json({ message: "KYC completed", user });
  } catch (err) {
    console.error("completeKyc error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Upload Avatar
export const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    // Store relative path to allow client to construct full URL based on its environment
    // windows handle path separator
    const relativePath = req.file.path.replace(/\\/g, "/");
    const avatarUrl = `/${relativePath}`;

    user.avatarUrl = avatarUrl;
    await user.save();

    return res.json({ message: "Avatar updated", avatarUrl, user });
  } catch (err) {
    console.error("uploadAvatar error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete User Account
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete associated wallets
    await Wallet.deleteMany({ userId: user._id });

    // Delete associated transactions (optional, depending on retention policy, but usually good to clean up)
    const Transaction = (await import("../models/Transaction.js")).default;
    await Transaction.deleteMany({ userId: user._id });

    // Delete the user
    await User.findByIdAndDelete(user._id);

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
