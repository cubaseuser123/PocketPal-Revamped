#!/usr/bin/env node
/**
 * Test Scenario Seed Script
 * Nukes DB and creates specific test users for demo/testing
 * Run: node apps/backend/scripts/seedTestScenario.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Models
import User from "../models/User.js";
import Wallet, { PPI_LIMITS } from "../models/Wallet.js";
import Goal from "../models/Goal.js";
import Friend from "../models/Friend.js";
import Subscription from "../models/subscription.js";
import BossBattle from "../models/BossBattle.js";
import Quest from "../models/Quest.js";

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pocketpal";

// --- Data Definitions ---

const HARSH_MAX = {
  name: "Harsh Max",
  phone: "+919860915237",
  level: 25,
  coins: 58400,
  kycCompleted: true, // Full KYC
  onboardingCompleted: true,
  role: "user",
};

const HARSH_MIN = {
  name: "Harsh Min",
  phone: "+919130413504",
  level: 5,
  coins: 2400,
  kycCompleted: false, // Min KYC
  onboardingCompleted: true,
  role: "user",
};

const FRIEND_USERS = [
  { name: "Siddharth", level: 18, coins: 15600, kyc: true },
  { name: "Riya", level: 22, coins: 32000, kyc: true },
  { name: "Arjun", level: 12, coins: 8900, kyc: false },
  { name: "Ananya", level: 28, coins: 45000, kyc: true },
  { name: "Kabir", level: 7, coins: 3500, kyc: false },
  { name: "Zara", level: 15, coins: 12500, kyc: true },
  { name: "Vihaan", level: 4, coins: 1200, kyc: false },
];

const BOSS_BATTLES = [
  {
    name: "The Inflation Monster",
    description: "Weekly Boss: Fight rising prices by saving more!",
    emoji: "📈",
    sidekickEmoji: "💸",
    totalHealth: 50000,
    currentHealth: 25000, // Half health
    status: "active",
    rewards: { coins: 1000, xp: 500 },
    startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
    endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    name: "The Impulse Imp",
    description: "Upcoming: Don't let impulse buys drain your wallet!",
    emoji: "😈",
    sidekickEmoji: "🛍️",
    totalHealth: 30000,
    currentHealth: 30000,
    status: "upcoming",
    rewards: { coins: 500, xp: 250 },
    startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Details in 5 days
    endsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
  },
];

const QUEST_TEMPLATES = [
  { title: "No Spend Day", type: "spending", target: 1, reward: 100 },
  { title: "Save ₹500", type: "savings", target: 500, reward: 200 },
  { title: "3 Day Streak", type: "streak", target: 3, reward: 300 },
  { title: "Refer a Friend", type: "social", target: 1, reward: 500 },
];

const SUBSCRIPTIONS = [
  { name: "Netflix Premium", price: 649, category: "entertainment", cycle: "monthly" },
  { name: "Spotify Duo", price: 169, category: "music", cycle: "monthly" },
  { name: "Gym Membership", price: 15000, category: "health", cycle: "yearly" },
  { name: "Amazon Prime", price: 1499, category: "shopping", cycle: "yearly" },
  { name: "Youtube Premium", price: 129, category: "entertainment", cycle: "monthly" },
];

const GOAL_TEMPLATES = [
  { name: "New Laptop", target: 80000, color: "#4A90E2", emoji: "💻" },
  { name: "Bali Trip", target: 150000, color: "#FF5A5F", emoji: "✈️" },
  { name: "Emergency Fund", target: 50000, color: "#2ECC71", emoji: "💰" },
  { name: "New Bike", target: 200000, color: "#F39C12", emoji: "🏍️" },
  { name: "Concert Tickets", target: 15000, color: "#9B59B6", emoji: "🎫" },
];

// --- Helper Functions ---

async function createUser(userData, isTestUser = false) {
  const phone = isTestUser 
    ? userData.phone 
    : `+91${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
  
  const user = await User.create({
    name: userData.name,
    phone: phone,
    level: userData.level,
    coins: userData.coins,
    kycCompleted: userData.kycCompleted || userData.kyc, // Handle both key names
    onboardingCompleted: true,
    role: "user",
    // Friend code handled by pre-save hook
  });

  // Create Wallets
  const ppiType = user.kycCompleted ? "full_kyc_ppi" : "small_ppi";
  const limits = PPI_LIMITS[ppiType];
  
  // Primary Wallet (Spending) - random balance within limits
  const maxPrimary = Math.min(20000, limits.maxBalance);
  await Wallet.create({
    userId: user._id,
    type: "primary",
    ppiType: ppiType,
    balance: Math.floor(Math.random() * maxPrimary),
  });

  // Savings Wallet - higher balance for fun
  await Wallet.create({
    userId: user._id,
    type: "savings",
    balance: Math.floor(Math.random() * 50000) + 1000,
  });

  return user;
}

async function createGoals(userId, count = 2) {
  for (let i = 0; i < count; i++) {
    const template = GOAL_TEMPLATES[Math.floor(Math.random() * GOAL_TEMPLATES.length)];
    const saved = Math.floor(Math.random() * (template.target * 0.8)); // 0-80% progress
    
    await Goal.create({
      userId,
      name: template.name,
      targetAmount: template.target,
      currentAmount: saved,
      color: template.color,
      emoji: template.emoji,
      category: "Savings",
      isFeatured: i === 0, // Feature the first one
    });
  }
}

async function createSubscriptions(userId, count = 2) {
  for (let i = 0; i < count; i++) {
    const sub = SUBSCRIPTIONS[Math.floor(Math.random() * SUBSCRIPTIONS.length)];
    const nextRenewal = new Date();
    nextRenewal.setDate(nextRenewal.getDate() + Math.floor(Math.random() * 30));
    
    await Subscription.create({
      userId,
      name: sub.name,
      price: sub.price,
      category: sub.category,
      renewalCycle: sub.cycle,
      startDate: new Date(),
      nextRenewal: nextRenewal,
      status: "active",
    });
  }
}

// --- Main Script ---

async function seedTestScenario() {
  try {
    console.log("🚀 Starting Test Scenario Seeding...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Nuke Database
    console.log("💥 Nuking Database...");
    await Promise.all([
      User.deleteMany({}),
      Wallet.deleteMany({}),
      Goal.deleteMany({}),
      Friend.deleteMany({}),
      Subscription.deleteMany({}),
      BossBattle.deleteMany({}),
      Quest.deleteMany({}),
    ]);
    console.log("✅ Database Nuked");

    // 2. Create Test Users
    console.log("👤 Creating Test Users...");
    const harshMax = await createUser(HARSH_MAX, true);
    console.log(`   Created Harsh Max (${harshMax.phone})`);
    
    const harshMin = await createUser(HARSH_MIN, true);
    console.log(`   Created Harsh Min (${harshMin.phone})`);

    // 3. Create Friend Network
    console.log("👥 Creating Friend Network...");
    const friends = [];
    for (const friendData of FRIEND_USERS) {
      const friend = await createUser(friendData);
      friends.push(friend);
    }
    console.log(`   Created ${friends.length} friend users`);

    // 4. Establish Friendships (Mesh Network)
    console.log("🤝 Establishing Friendships...");
    
    // Connect Max to all friends
    for (const friend of friends) {
      await Friend.create({ requester: harshMax._id, recipient: friend._id, status: "accepted" });
      await Friend.create({ requester: friend._id, recipient: harshMax._id, status: "accepted" }); // Bi-directional for easier querying? Or does model handle? 
      // Checking model: Compound index on requester/recipient. Usually friend logic implies one doc per direction or one doc per pair. 
      // Let's stick to standard social graph: A -> B (accepted).
      // To ensure they show up in each others lists easily without complex aggregation, often easier to have bi-directional, 
      // BUT typical optimization is one record + complex query. Let's make it robust by ensuring they 'friended' each other for simple logic.
      // Actually, typical 'Friend' model often just needs one accepted record if logic checks both fields. 
      // Let's create one accepted record per pair.
    }
    
    // Connect Min to half the friends
    for (let i = 0; i < Math.floor(friends.length / 2); i++) {
        const friend = friends[i];
         // Check if relationship already exists (it shouldn't, we are fresh)
         await Friend.create({ requester: harshMin._id, recipient: friend._id, status: "accepted" });
    }

    // Connect Max and Min
    await Friend.create({ requester: harshMax._id, recipient: harshMin._id, status: "accepted" });

    // 5. Populate Wealth & Goals
    console.log("💰 Populating Wealth & Goals...");
    
    // Max & Min Data
    await createGoals(harshMax._id, 3);
    await createSubscriptions(harshMax._id, 4);
    
    await createGoals(harshMin._id, 1);
    await createSubscriptions(harshMin._id, 1);

    // Friends Data
    for (const friend of friends) {
        await createGoals(friend._id, 2);
        if (Math.random() > 0.5) await createSubscriptions(friend._id, 2);
    }

    // 6. Gamification
    console.log("🎮 Setting up Gamification...");
    
    // Create Quests
    const createdQuests = [];
    for (const qTemplate of QUEST_TEMPLATES) {
        const quest = await Quest.create({
            title: qTemplate.title,
            description: `Complete this to earn ${qTemplate.reward} coins!`,
            type: qTemplate.type,
            requirement: { action: "test_action", target: qTemplate.target },
            rewards: { coins: qTemplate.reward, xp: 50 },
            isActive: true,
        });
        createdQuests.push(quest);
    }

    // Assign Quests to Max (One completed, one in progress)
    if (createdQuests.length > 0) {
        createdQuests[0].assignedUsers.push({
            userId: harshMax._id,
            progress: createdQuests[0].requirement.target,
            completed: true,
            completedAt: new Date()
        });
        await createdQuests[0].save();

        if (createdQuests.length > 1) {
            createdQuests[1].assignedUsers.push({
                userId: harshMax._id,
                progress: 1, // Started
                completed: false
            });
            await createdQuests[1].save();
        }
    }

    // Create Boss Battle & Leaderboard
    for (const bossData of BOSS_BATTLES) {
       const boss = await BossBattle.create(bossData);
       
       if (boss.status === "active") {
           // Populate Leaderboard with Friends + Max + Min
           const participants = [harshMax, harshMin, ...friends];
           
           for (const p of participants) {
               // Random damage logic based on level
               const damage = Math.floor(Math.random() * (p.level * 100)) + 500;
               boss.leaderboard.push({
                   userId: p._id,
                   damage: damage
               });
           }
           // Sort leaderboard in memory before saving? Model has virtual, but we push directly.
           await boss.save();
       }
    }

    console.log("\n🎉 SEEDING COMPLETE! 🎉");
    console.log("--------------------------------");
    console.log(`Login 1: Harsh Max / ${HARSH_MAX.phone} (Full KYC)`);
    console.log(`Login 2: Harsh Min / ${HARSH_MIN.phone} (Min KYC)`);
    console.log("--------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding Failed:", error);
    process.exit(1);
  }
}

seedTestScenario();
