import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { db } from "../config/db.js";
import { sql } from "drizzle-orm";
import { eq, and } from "drizzle-orm";
import {
  users, wallets, categories, transactions, goals, friends,
  bossBattles, bossBattleLeaderboard, quests, questAssignments,
  userBadges, subscriptions, notifications, shopItems, userPurchases,
  splitGroups, splitGroupMembers, splitExpenses, sessions,
  conversationMemory, duels
} from "../drizzle/schema.js";

const TARGET_PHONE = "+919860915237";

const resetAndSeed = async () => {
  console.log("🗑️  Clearing ALL data...\n");

  // Delete in order respecting foreign keys
  await db.delete(userPurchases);
  await db.delete(shopItems);
  await db.delete(duels);
  await db.delete(bossBattleLeaderboard);
  await db.delete(questAssignments);
  await db.delete(userBadges);
  await db.delete(notifications);
  await db.delete(conversationMemory);
  await db.delete(splitExpenses);
  await db.delete(splitGroupMembers);
  await db.delete(splitGroups);
  await db.delete(transactions);
  await db.delete(subscriptions);
  await db.delete(goals);
  await db.delete(friends);
  await db.delete(bossBattles);
  await db.delete(quests);
  await db.delete(wallets);
  await db.delete(sessions);
  await db.delete(categories);
  await db.delete(users);

  console.log("✅ All data cleared!\n");

  // ────────────────────────────────────────
  // 1. MAIN USER (Full KYC)
  // ────────────────────────────────────────
  console.log("👤 Creating main user...");
  const [mainUser] = await db.insert(users).values({
    name: "Harsh Kapse",
    phoneNumber: TARGET_PHONE,
    phoneNumberVerified: true,
    level: 12,
    coins: 2450,
    kycCompleted: true,
    onboardingCompleted: true,
    onboardingCompletedAt: new Date(),
    totalGoalsCompleted: 3,
    friendCode: "HARS1485",
  }).returning();

  // ────────────────────────────────────────
  // 2. WALLETS
  // ────────────────────────────────────────
  console.log("� Creating wallets...");
  const [primaryWallet] = await db.insert(wallets).values({
    userId: mainUser.id,
    type: "primary",
    balance: "18750.50",
    ppiType: "full_kyc_ppi",
    monthlyLoaded: "45000.00",
  }).returning();

  const [savingsWallet] = await db.insert(wallets).values({
    userId: mainUser.id,
    type: "savings",
    balance: "125000.00",
  }).returning();

  // ────────────────────────────────────────
  // 3. CATEGORIES
  // ────────────────────────────────────────
  console.log("🏷️  Creating categories...");
  const catData = [
    { name: "Food", emoji: "🍔", color: "#FF6B6B" },
    { name: "Transport", emoji: "🚗", color: "#4ECDC4" },
    { name: "Shopping", emoji: "🛍️", color: "#A78BFA" },
    { name: "Entertainment", emoji: "🎬", color: "#F59E0B" },
    { name: "Education", emoji: "📚", color: "#3B82F6" },
    { name: "Health", emoji: "💊", color: "#10B981" },
    { name: "Bills", emoji: "📱", color: "#EF4444" },
    { name: "Groceries", emoji: "🛒", color: "#22D3EE" },
    { name: "Subscriptions", emoji: "📺", color: "#8B5CF6" },
    { name: "Salary", emoji: "💼", color: "#34D399", isDefault: true },
  ];

  const cats = {};
  for (const c of catData) {
    const [cat] = await db.insert(categories).values(c).returning();
    cats[c.name] = cat;
  }

  // ────────────────────────────────────────
  // 4. TRANSACTIONS (last 30 days, realistic student spending)
  // ────────────────────────────────────────
  console.log("💳 Creating transactions...");
  const now = new Date();
  const txnData = [
    // Today
    { name: "Zomato Order", emoji: "🍕", amount: "-289.00", type: "expense", cat: "Food", daysAgo: 0 },
    { name: "Uber Ride", emoji: "🚕", amount: "-152.00", type: "expense", cat: "Transport", daysAgo: 0 },
    // Yesterday
    { name: "Monthly Salary", emoji: "💰", amount: "35000.00", type: "income", cat: "Salary", daysAgo: 1 },
    { name: "Swiggy", emoji: "🍜", amount: "-450.00", type: "expense", cat: "Food", daysAgo: 1 },
    // 2 days ago
    { name: "Amazon — Headphones", emoji: "🎧", amount: "-2499.00", type: "expense", cat: "Shopping", daysAgo: 2 },
    { name: "Tea Stall", emoji: "☕", amount: "-30.00", type: "expense", cat: "Food", daysAgo: 2 },
    // 3 days ago
    { name: "Movie Tickets", emoji: "🎬", amount: "-500.00", type: "expense", cat: "Entertainment", daysAgo: 3 },
    { name: "Auto Rickshaw", emoji: "🛺", amount: "-85.00", type: "expense", cat: "Transport", daysAgo: 3 },
    // 5 days ago
    { name: "Electricity Bill", emoji: "⚡", amount: "-1200.00", type: "expense", cat: "Bills", daysAgo: 5 },
    { name: "Groceries — BigBasket", emoji: "🛒", amount: "-1850.00", type: "expense", cat: "Groceries", daysAgo: 5 },
    // 7 days ago
    { name: "Coursera Subscription", emoji: "📚", amount: "-999.00", type: "expense", cat: "Education", daysAgo: 7 },
    { name: "Freelance Payment", emoji: "💻", amount: "8000.00", type: "income", cat: "Salary", daysAgo: 7 },
    // 10 days ago
    { name: "Nike Shoes", emoji: "👟", amount: "-4999.00", type: "expense", cat: "Shopping", daysAgo: 10 },
    { name: "Dominos", emoji: "🍕", amount: "-650.00", type: "expense", cat: "Food", daysAgo: 10 },
    // 14 days ago
    { name: "Gym Membership", emoji: "💪", amount: "-1500.00", type: "expense", cat: "Health", daysAgo: 14 },
    { name: "Metro Card Recharge", emoji: "🚇", amount: "-500.00", type: "expense", cat: "Transport", daysAgo: 14 },
    // 20 days ago
    { name: "Birthday Gift", emoji: "🎁", amount: "-1200.00", type: "expense", cat: "Shopping", daysAgo: 20 },
    { name: "Café Coffee Day", emoji: "☕", amount: "-320.00", type: "expense", cat: "Food", daysAgo: 20 },
    // 25 days ago
    { name: "Mobile Recharge", emoji: "📱", amount: "-599.00", type: "expense", cat: "Bills", daysAgo: 25 },
    { name: "Internship Stipend", emoji: "🎓", amount: "15000.00", type: "income", cat: "Salary", daysAgo: 25 },
    // 30 days ago
    { name: "Rent Transfer", emoji: "🏠", amount: "-8000.00", type: "expense", cat: "Bills", daysAgo: 30 },
  ];

  for (const t of txnData) {
    const txnDate = new Date(now);
    txnDate.setDate(txnDate.getDate() - t.daysAgo);
    await db.insert(transactions).values({
      userId: mainUser.id,
      walletId: primaryWallet.id,
      categoryId: cats[t.cat]?.id || null,
      name: t.name,
      emoji: t.emoji,
      amount: t.amount,
      type: t.type,
      createdAt: txnDate,
    });
  }

  // ────────────────────────────────────────
  // 5. GOALS
  // ────────────────────────────────────────
  console.log("🎯 Creating goals...");
  await db.insert(goals).values([
    {
      userId: mainUser.id, name: "New MacBook Pro", emoji: "💻", color: "#3B82F6",
      category: "Tech", targetAmount: "200000", currentAmount: "120000",
      isFeatured: true, targetDate: new Date("2025-06-01"),
    },
    {
      userId: mainUser.id, name: "Europe Trip", emoji: "✈️", color: "#8B5CF6",
      category: "Travel", targetAmount: "350000", currentAmount: "78000",
      targetDate: new Date("2025-12-01"),
    },
    {
      userId: mainUser.id, name: "Emergency Fund", emoji: "🏥", color: "#10B981",
      category: "Savings", targetAmount: "100000", currentAmount: "100000",
      isCompleted: true,
    },
    {
      userId: mainUser.id, name: "Gaming Setup", emoji: "🎮", color: "#EF4444",
      category: "Gaming", targetAmount: "80000", currentAmount: "32000",
      targetDate: new Date("2025-08-15"),
    },
  ]);

  // ────────────────────────────────────────
  // 6. FRIENDS (5 dummy users)
  // ────────────────────────────────────────
  console.log("🤝 Creating friends...");
  const friendData = [
    { name: "Rahul Sharma", phone: "+919876543210", level: 8, coins: 1200 },
    { name: "Priya Patel", phone: "+919876543211", level: 15, coins: 3400 },
    { name: "Amit Verma", phone: "+919876543212", level: 5, coins: 680 },
    { name: "Sneha Gupta", phone: "+919876543213", level: 10, coins: 1850 },
    { name: "Vikram Singh", phone: "+919876543214", level: 22, coins: 4200 },
  ];

  const friendUsers = [];
  for (const f of friendData) {
    const [friendUser] = await db.insert(users).values({
      name: f.name, phoneNumber: f.phone, phoneNumberVerified: true, level: f.level, coins: f.coins,
      kycCompleted: true, onboardingCompleted: true,
      friendCode: `FC${Math.floor(1000 + Math.random() * 9000)}`,
      totalGoalsCompleted: Math.floor(Math.random() * 8),
    }).returning();
    friendUsers.push(friendUser);

    // Create wallets for friend
    await db.insert(wallets).values([
      { userId: friendUser.id, type: "primary", balance: (Math.random() * 30000 + 5000).toFixed(2) },
      { userId: friendUser.id, type: "savings", balance: (Math.random() * 80000 + 10000).toFixed(2) },
    ]);

    // Create friendship (accepted)
    await db.insert(friends).values({
      requesterId: mainUser.id,
      recipientId: friendUser.id,
      status: "accepted",
    });
  }

  // ────────────────────────────────────────
  // 7. BOSS BATTLES
  // ────────────────────────────────────────
  console.log("👾 Creating Boss Battles...");
  const [activeBoss] = await db.insert(bossBattles).values({
    name: "Inflation Dragon",
    description: "The classic enemy of savings. Every rupee saved deals damage!",
    emoji: "🐲", sidekickEmoji: "�",
    totalHealth: 50000, currentHealth: 28000,
    rewardCoins: 500, rewardXp: 1000,
    status: "active",
    startsAt: new Date(now.getTime() - 7 * 86400000),
    endsAt: new Date(now.getTime() + 7 * 86400000),
  }).returning();

  await db.insert(bossBattles).values({
    name: "Impulse Buy Imp",
    description: "A sneaky demon that tempts you with flash sales and limited offers!",
    emoji: "😈", sidekickEmoji: "💸",
    totalHealth: 30000, currentHealth: 30000,
    rewardCoins: 300, rewardXp: 600,
    status: "upcoming",
    startsAt: new Date(now.getTime() + 8 * 86400000),
    endsAt: new Date(now.getTime() + 22 * 86400000),
  });

  // Leaderboard for active boss
  await db.insert(bossBattleLeaderboard).values({
    battleId: activeBoss.id, userId: mainUser.id, damage: 8500,
  });
  for (const f of friendUsers) {
    await db.insert(bossBattleLeaderboard).values({
      battleId: activeBoss.id, userId: f.id,
      damage: Math.floor(Math.random() * 7000 + 1000),
    });
  }

  // ────────────────────────────────────────
  // 8. QUESTS
  // ────────────────────────────────────────
  console.log("📜 Creating Quests...");
  const questList = [
    { title: "Save ₹500 Today", description: "Transfer ₹500 to savings.", type: "savings", difficulty: "easy", rewardCoins: 50, rewardXp: 100, requirementAction: "save", requirementTarget: 500 },
    { title: "Zero Spend Day", description: "No expense transactions today.", type: "spending", difficulty: "medium", rewardCoins: 100, rewardXp: 200, requirementAction: "no_spend", requirementTarget: 1 },
    { title: "Track 5 Expenses", description: "Log 5 expense transactions.", type: "spending", difficulty: "easy", rewardCoins: 30, rewardXp: 60, requirementAction: "track", requirementTarget: 5 },
    { title: "Goal Crusher", description: "Add ₹1000 to any goal.", type: "savings", difficulty: "hard", rewardCoins: 150, rewardXp: 300, requirementAction: "goal_add", requirementTarget: 1000 },
    { title: "Social Saver", description: "Create a Split Group with friends.", type: "social", difficulty: "medium", rewardCoins: 75, rewardXp: 150, requirementAction: "split_create", requirementTarget: 1 },
  ];

  const createdQuests = [];
  for (const q of questList) {
    const [quest] = await db.insert(quests).values({ ...q, isActive: true }).returning();
    createdQuests.push(quest);
  }

  // Assign quests to main user
  for (let i = 0; i < createdQuests.length; i++) {
    const q = createdQuests[i];
    const isCompleted = i < 2; // First 2 completed
    await db.insert(questAssignments).values({
      questId: q.id, userId: mainUser.id,
      progress: isCompleted ? (q.requirementTarget || 1) : Math.floor(Math.random() * (q.requirementTarget || 1)),
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : null,
    });
  }

  // ────────────────────────────────────────
  // 9. BADGES
  // ────────────────────────────────────────
  console.log("🏅 Awarding Badges...");
  const badgeIds = ["saver_starter", "streak_3", "first_goal", "social_butterfly", "high_roller"];
  for (const bId of badgeIds) {
    await db.insert(userBadges).values({ userId: mainUser.id, badgeId: bId });
  }

  // ────────────────────────────────────────
  // 10. SUBSCRIPTIONS
  // ────────────────────────────────────────
  console.log("📺 Creating Subscriptions...");
  const subData = [
    { name: "Netflix", price: "649.00", category: "Entertainment", cycle: "monthly", daysToRenewal: 12 },
    { name: "Spotify", price: "119.00", category: "Music", cycle: "monthly", daysToRenewal: 5 },
    { name: "ChatGPT Plus", price: "1700.00", category: "Productivity", cycle: "monthly", daysToRenewal: 18 },
    { name: "iCloud+", price: "75.00", category: "Cloud", cycle: "monthly", daysToRenewal: 22 },
  ];

  for (const s of subData) {
    const nextRenewal = new Date(now);
    nextRenewal.setDate(nextRenewal.getDate() + s.daysToRenewal);
    const startDate = new Date(nextRenewal);
    startDate.setMonth(startDate.getMonth() - 1);
    await db.insert(subscriptions).values({
      userId: mainUser.id, name: s.name, price: s.price,
      category: s.category, startDate, nextRenewal,
      renewalCycle: s.cycle, status: "active",
    });
  }

  // ────────────────────────────────────────
  // 11. SHOP ITEMS
  // ────────────────────────────────────────
  console.log("🛒 Creating Shop Items...");
  const shopData = [
    // Boosts
    { name: "Streak Shield", description: "Protect your streak for 1 day if you miss.", emoji: "🛡️", category: "boosts", price: 50 },
    { name: "Bonus Spin", description: "Get an extra Savings Wheel spin today.", emoji: "🎰", category: "boosts", price: 30 },
    { name: "2x XP (24h)", description: "Double XP from all activities for 24 hours.", emoji: "⚡", category: "boosts", price: 80 },
    // Avatar Frames
    { name: "Gold Frame", description: "A shiny gold border around your avatar.", emoji: "🖼️", category: "avatar_frames", price: 100 },
    { name: "Neon Frame", description: "Glowing neon border that stands out.", emoji: "💜", category: "avatar_frames", price: 150 },
    { name: "Fire Frame", description: "Your avatar, but on fire.", emoji: "🔥", category: "avatar_frames", price: 200 },
    // Pally Personalities
    { name: "Savage Pally", description: "Pally roasts harder and pulls no punches.", emoji: "😎", category: "pally_packs", price: 200 },
    { name: "Motivator Pally", description: "Extra encouraging, like a personal coach.", emoji: "💪", category: "pally_packs", price: 150 },
    // Themes
    { name: "Midnight Purple", description: "Deep purple theme for the app.", emoji: "🌌", category: "themes", price: 120 },
    { name: "Ocean Blue", description: "Cool ocean-inspired color scheme.", emoji: "🌊", category: "themes", price: 120 },
  ];

  for (const s of shopData) {
    await db.insert(shopItems).values(s);
  }

  // ────────────────────────────────────────
  // 12. DUELS
  // ────────────────────────────────────────
  console.log("⚔️  Creating Duels...");
  // Active duel — spans 1 week from now
  await db.insert(duels).values({
    challengerId: mainUser.id,
    challengedId: friendUsers[0].id,
    type: "most_saved",
    wager: 50,
    status: "active",
    startDate: new Date(now.getTime() - 2 * 86400000),
    endDate: new Date(now.getTime() + 5 * 86400000),
    challengerProgress: 1200,
    challengedProgress: 800,
  });

  // Pending duel — someone challenged you, spans 1 month
  await db.insert(duels).values({
    challengerId: friendUsers[1].id,
    challengedId: mainUser.id,
    type: "fewest_expenses",
    wager: 30,
    status: "pending",
    startDate: new Date(now.getTime()),
    endDate: new Date(now.getTime() + 30 * 86400000),
  });

  // Completed duel — you won last week
  await db.insert(duels).values({
    challengerId: mainUser.id,
    challengedId: friendUsers[2].id,
    type: "no_spend_streak",
    wager: 25,
    status: "completed",
    startDate: new Date(now.getTime() - 14 * 86400000),
    endDate: new Date(now.getTime() - 7 * 86400000),
    winnerId: mainUser.id,
    challengerProgress: 5,
    challengedProgress: 3,
  });

  // ────────────────────────────────────────
  // 12. NOTIFICATIONS
  // ────────────────────────────────────────
  console.log("� Creating Notifications...");
  const notifData = [
    { type: "celebration", title: "Goal Milestone! 🎉", body: "You've saved 60% of your MacBook Pro goal!" },
    { type: "insight", title: "Spending Alert 📊", body: "You spent ₹4,999 on Shopping this week — 40% more than last week." },
    { type: "reminder", title: "Streak Check ⏰", body: "Log a transaction today to keep your streak alive!" },
    { type: "alert", title: "Bill Due Soon 💳", body: "Your Spotify renewal is in 5 days (₹119)." },
    { type: "celebration", title: "Quest Complete! 🏆", body: "You finished 'Save ₹500 Today' — 50 coins earned!" },
  ];

  for (const n of notifData) {
    await db.insert(notifications).values({
      userId: mainUser.id, ...n,
    });
  }

  console.log("\n🎉 ═══════════════════════════════════════");
  console.log(`   User: ${mainUser.name}`);
  console.log(`   Phone: ${mainUser.phoneNumber}`);
  console.log(`   Level: 12 | Coins: 2,450`);
  console.log(`   Primary: ₹18,750 | Savings: ₹1,25,000`);
  console.log(`   Friends: ${friendUsers.length} | Goals: 4`);
  console.log(`   Transactions: ${txnData.length}`);
  console.log(`   Shop Items: ${shopData.length}`);
  console.log("   ═══════════════════════════════════════ 🎉\n");
  console.log("✅ Database reset and seeded successfully!");
  process.exit(0);
};

resetAndSeed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
