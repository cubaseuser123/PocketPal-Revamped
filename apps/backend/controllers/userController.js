import { db } from "../config/db.js";
import { users, wallets, transactions } from "../drizzle/schema.js";
import { eq, sql } from "drizzle-orm";

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      with: { wallets: true },
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ message: "User not found" });
    }

    const userWallets = user.wallets || [];
    
    const primaryWallet = userWallets.find(w => w.type === "primary");
    const savingsWallet = userWallets.find(w => w.type === "savings");

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
        id: user.id,
        name: user.name,
        phone: user.phone,
        level: user.level,
        coins: user.coins,
        avatarUrl: user.avatarUrl,
        kycCompleted: user.kycCompleted,
        onboardingCompleted: !shouldShowOnboarding,
        friendCode: user.friendCode,
      },
      wallets: {
        primary: Number(primaryWallet?.balance || 0),
        savings: Number(savingsWallet?.balance || 0),
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
    
    if (!name && !avatarUrl) {
        return res.status(400).json({ message: "Please provide a name or avatar to update" });
    }

    // Get current user to check for existing friend code
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
    });

    if (!currentUser) return res.status(404).json({ message: "User not found" });

    let updates = {
        ...(name && { name }),
        ...(avatarUrl && { avatarUrl }),
    };

    // Generate unique friend code if missing
    if (!currentUser.friendCode) {
        let isUnique = false;
        let newFriendCode = "";
        
        // Try to generate a unique code (limit attempts to prevent infinite loops, though unlikely)
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            // Generate 6-char random alphanumeric code (uppercase)
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            newFriendCode = "";
            for (let i = 0; i < 6; i++) {
                newFriendCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            // Check if code exists in DB
            const existingWithCode = await db.query.users.findFirst({
                where: eq(users.friendCode, newFriendCode),
            });
            
            if (!existingWithCode) {
                isUnique = true;
            }
            attempts++;
        }
        
        if (isUnique) {
            updates.friendCode = newFriendCode;
        } else {
             // Fallback if loop fails (extremely rare) - use timestamp to guarantee uniqueness
             updates.friendCode = `FC${Date.now().toString().slice(-6)}`;
        }
    }
    
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, req.user.id))
      .returning();
    
    return res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Complete onboarding
export const completeOnboarding = async (req, res) => {
  try {
    const { amount } = req.body;
    const initialBalance = amount ? parseInt(amount) : 0;

    const result = await db.transaction(async (tx) => {
      // Update user
      const [user] = await tx.update(users)
        .set({
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            coins: sql`${users.coins} + 20`,
        })
        .where(eq(users.id, req.user.id))
        .returning();
      
      // Check if wallets exist
      const existingWallets = await tx.query.wallets.findMany({ 
        where: eq(wallets.userId, req.user.id) 
      });
      
      let primaryWallet;
      
      if (existingWallets.length === 0) {
        // Create wallets
        [primaryWallet] = await tx.insert(wallets).values({ 
            userId: req.user.id, 
            type: "primary", 
            balance: initialBalance 
        }).returning();
        
        await tx.insert(wallets).values({ 
            userId: req.user.id, 
            type: "savings", 
            balance: 0 
        });
      } else {
        primaryWallet = existingWallets.find(w => w.type === "primary");
        if (primaryWallet && initialBalance > 0) {
          [primaryWallet] = await tx.update(wallets)
            .set({ 
                balance: sql`${wallets.balance} + ${initialBalance}`
            })
            .where(eq(wallets.id, primaryWallet.id))
            .returning();
        }
      }

      // Create Initial Transaction if amount > 0
      if (initialBalance > 0 && primaryWallet) {
        await tx.insert(transactions).values({
            userId: req.user.id,
            walletId: primaryWallet.id,
            amount: initialBalance,
            type: "income",
            name: "Initial Deposit",
            emoji: "💰",
        });
      }

      return user;
    });

    return res.json({ 
      message: "Onboarding completed", 
      coins: result.coins,
      user: result,
    });
  } catch (err) {
    console.error("completeOnboarding error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Complete KYC
export const completeKyc = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.id) });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.kycCompleted) {
      return res.status(400).json({ message: "KYC already completed" });
    }

    const [updatedUser] = await db.update(users)
      .set({
        kycCompleted: true,
        coins: sql`${users.coins} + 100`, // Award 100 coins
      })
      .where(eq(users.id, req.user.id))
      .returning();

    return res.json({ message: "KYC completed", user: updatedUser });
  } catch (err) {
    console.error("completeKyc error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Upload Avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const relativePath = req.file.path.replace(/\\/g, "/");
    const avatarUrl = `/${relativePath}`;

    const [user] = await db.update(users)
      .set({ avatarUrl })
      .where(eq(users.id, req.user.id))
      .returning();

    return res.json({ message: "Avatar updated", avatarUrl, user });
  } catch (err) {
    console.error("uploadAvatar error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete User Account (Soft Delete)
export const deleteUser = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.id) });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const timestamp = Date.now();

    await db.update(users)
      .set({
        deletedAt: new Date(timestamp),
        phone: `${user.phone}_deleted_${timestamp}`,
        ...(user.friendCode && { friendCode: `${user.friendCode}_deleted_${timestamp}` }),
      })
      .where(eq(users.id, req.user.id));

    return res.json({ message: "User account deactivated successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
// Check if user exists (for registration flow)
export const checkUserExists = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone.trim()}`;
    
    const user = await db.query.users.findFirst({
      where: eq(users.phone, formattedPhone),
    });

    return res.json({ 
      exists: !!user,
      message: user ? "User exists" : "User not found" 
    });
  } catch (err) {
    console.error("checkUserExists error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
