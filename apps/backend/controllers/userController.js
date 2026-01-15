import User from "../models/User.js";
import Wallet from "../models/Wallet.js";

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's wallets
    const wallets = await Wallet.find({ userId: user._id });
    const primaryWallet = wallets.find(w => w.type === "primary");
    const savingsWallet = wallets.find(w => w.type === "savings");

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        level: user.level,
        coins: user.coins,
        avatarUrl: user.avatarUrl,
        kycCompleted: user.kycCompleted,
        onboardingCompleted: user.onboardingCompleted,
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
    
    // Award coins for completing onboarding
    user.coins = (user.coins || 0) + 20;
    
    await user.save();

    // Create wallets if they don't exist
    const existingWallets = await Wallet.find({ userId: user._id });
    if (existingWallets.length === 0) {
      await Wallet.create([
        { userId: user._id, type: "primary", balance: 0 },
        { userId: user._id, type: "savings", balance: 0 },
      ]);
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

    user.kycCompleted = true;
    
    // Level Up Logic: KYC moves user to Level 2
    if (user.level < 2) {
      user.level = 2;
      // Award XP/Coins for leveling up
      user.coins = (user.coins || 0) + 500;
    }
    
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
