import { db } from "../config/db.js";
import { users, wallets, transactions, goals, categories } from "../drizzle/schema.js";
import { eq, sql, and, desc, asc, gte } from "drizzle-orm";

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ message: "User not found" });
    }

    const userWallets = await db
      .select({
        id: wallets.id,
        type: wallets.type,
        balance: wallets.balance,
      })
      .from(wallets)
      .where(eq(wallets.userId, req.user.id));
    
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
        phone: user.phoneNumber,
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
        phoneNumber: `${user.phoneNumber}_deleted_${timestamp}`,
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

    // Support both current schema (phone_number) and legacy schema (phone)
    // to avoid 500s in environments with partial/older migrations.
    const columnsResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('phone_number', 'phone')
    `);

    const columnNames = Array.isArray(columnsResult?.rows)
      ? columnsResult.rows.map((r) => r.column_name)
      : [];

    let exists = false;
    if (columnNames.includes("phone_number")) {
      const user = await db.query.users.findFirst({
        where: eq(users.phoneNumber, formattedPhone),
      });
      exists = !!user;
    } else if (columnNames.includes("phone")) {
      const legacyResult = await db.execute(sql`
        SELECT id FROM users WHERE phone = ${formattedPhone} LIMIT 1
      `);
      exists = Array.isArray(legacyResult?.rows) && legacyResult.rows.length > 0;
    }

    return res.json({ 
      exists,
      message: exists ? "User exists" : "User not found" 
    });
  } catch (err) {
    console.error("checkUserExists error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.abs(num) : 0;
};

const sumInRange = (txs, start, end) =>
  txs.reduce((sum, tx) => {
    const txDate = new Date(tx.createdAt);
    if (txDate >= start && txDate < end) {
      return sum + toAmount(tx.amount);
    }
    return sum;
  }, 0);

const buildWeekTrend = (txs, now) => {
  const today = startOfDay(now);
  const dayStarts = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    return day;
  });

  const labels = dayStarts.map((day) =>
    day.toLocaleDateString("en-US", { weekday: "short" })
  );

  const points = dayStarts.map((start, idx) => {
    const end =
      idx === dayStarts.length - 1
        ? new Date(today.getTime() + 24 * 60 * 60 * 1000)
        : dayStarts[idx + 1];
    return Math.round(sumInRange(txs, start, end));
  });

  return { chartPoints: points, chartLabels: labels };
};

const buildMonthTrend = (txs, now, monthStart) => {
  const end = new Date(now);
  const start = startOfDay(monthStart);
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const totalMs = Math.max(end.getTime() - start.getTime(), 1);

  const points = labels.map((_, idx) => {
    const bucketStart = new Date(start.getTime() + (totalMs * idx) / 4);
    const bucketEnd =
      idx === labels.length - 1
        ? end
        : new Date(start.getTime() + (totalMs * (idx + 1)) / 4);
    return Math.round(sumInRange(txs, bucketStart, bucketEnd));
  });

  return { chartPoints: points, chartLabels: labels };
};

const buildThreeMonthTrend = (txs, now) => {
  const monthStarts = Array.from({ length: 3 }, (_, idx) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (2 - idx), 1);
    monthDate.setHours(0, 0, 0, 0);
    return monthDate;
  });

  const labels = monthStarts.map((monthDate) =>
    monthDate.toLocaleDateString("en-US", { month: "short" })
  );

  const points = monthStarts.map((start, idx) => {
    const end =
      idx === monthStarts.length - 1
        ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
        : monthStarts[idx + 1];
    return Math.round(sumInRange(txs, start, end));
  });

  return { chartPoints: points, chartLabels: labels };
};

// Get aggregated dashboard data
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Calculate dates for spending summaries
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);
    
    const threeMonthStart = new Date(now);
    threeMonthStart.setMonth(threeMonthStart.getMonth() - 3);

    // Parallel DB queries
    const [
      user,
      userGoals,
      allCategories,
      txListWeek,
      txListMonth,
      txList3m
    ] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
      db.query.goals.findMany({
        where: eq(goals.userId, userId),
        orderBy: [desc(goals.isFeatured), desc(goals.createdAt)],
      }),
      db.query.categories.findMany({
        orderBy: [desc(categories.isDefault), asc(categories.name)],
      }),
      db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          gte(transactions.createdAt, weekStart)
        ),
      }),
      db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          gte(transactions.createdAt, monthStart)
        ),
      }),
      db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          gte(transactions.createdAt, threeMonthStart)
        ),
      }),
    ]);
    // Requery wallets with minimal columns to avoid runtime failures if optional
    // wallet columns differ across environments.
    const walletRows = await db
      .select({
        id: wallets.id,
        type: wallets.type,
        balance: wallets.balance,
      })
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (!user || user.deletedAt) {
      return res.status(404).json({ message: "User not found" });
    }

    // Process Wallets
    const primaryWallet = walletRows.find(w => w.type === "primary");
    const savingsWallet = walletRows.find(w => w.type === "savings");

    let shouldShowOnboarding = !user.onboardingCompleted;
    if (user.onboardingCompleted && user.onboardingCompletedAt) {
      const daysSinceOnboarding = (Date.now() - new Date(user.onboardingCompletedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceOnboarding > 30) {
        shouldShowOnboarding = true;
      }
    }

    // Process Spending Summaries
    const calcSummary = (txs, start) => {
      const totalSpent = txs.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const days = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
      return {
        totalSpent,
        avgPerDay: days > 0 ? Math.round(totalSpent / days) : 0,
      };
    };

    const weekSummary = calcSummary(txListWeek, weekStart);
    const monthSummary = calcSummary(txListMonth, monthStart);
    const threeMonthSummary = calcSummary(txList3m, threeMonthStart);
    const weekTrend = buildWeekTrend(txListWeek, now);
    const monthTrend = buildMonthTrend(txListMonth, now, monthStart);
    const threeMonthTrend = buildThreeMonthTrend(txList3m, now);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phoneNumber,
        level: user.level,
        coins: user.coins,
        avatarUrl: user.avatarUrl,
        kycCompleted: user.kycCompleted,
        onboardingCompleted: !shouldShowOnboarding,
        friendCode: user.friendCode,
      },
      wallets: {
        primary: { balance: Number(primaryWallet?.balance || 0) },
        savings: { balance: Number(savingsWallet?.balance || 0) },
        total: Number(primaryWallet?.balance || 0) + Number(savingsWallet?.balance || 0)
      },
      goals: userGoals.map(g => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        progress: Number(g.targetAmount) > 0 ? Number(g.currentAmount) / Number(g.targetAmount) : 0,
      })),
      categories: allCategories,
      spendingSummary: {
        week: {
          ...weekSummary,
          ...weekTrend,
        },
        month: {
          ...monthSummary,
          ...monthTrend,
        },
        "3m": {
          ...threeMonthSummary,
          ...threeMonthTrend,
        },
      }
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
