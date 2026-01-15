#!/usr/bin/env node
/**
 * Seed Script - Populates database with test data
 * Run: node scripts/seedAll.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import BossBattle from "../models/BossBattle.js";
import Quest from "../models/Quest.js";
import Wallet from "../models/Wallet.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pocketpal";

// Test Users (no OTP verification needed for testing)
const TEST_USERS = [
  { name: "Harsh", phone: "+919860915237", level: 16, coins: 13050, kycCompleted: true, onboardingCompleted: true },
  { name: "Sarah", phone: "+919876543210", level: 8, coins: 2500, kycCompleted: false, onboardingCompleted: true },
  { name: "Mike", phone: "+919876543211", level: 5, coins: 1200, kycCompleted: true, onboardingCompleted: true },
  { name: "Alex", phone: "+919876543212", level: 12, coins: 8000, kycCompleted: true, onboardingCompleted: true },
  { name: "Priya", phone: "+919876543213", level: 3, coins: 500, kycCompleted: false, onboardingCompleted: true },
];

// Boss Battles with 3-emoji style (Weekly + Monthly)
const BOSS_BATTLES = [
  // WEEKLY BOSS - Active now
  {
    name: "The Food Beast",
    description: "Weekly Challenge: Every skipped food delivery deals massive damage!",
    emoji: "🍔",
    sidekickEmoji: "🍟",
    totalHealth: 50000,
    currentHealth: 35000,
    status: "active",
    rewards: { coins: 500, xp: 200 },
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  // WEEKLY BOSS - Upcoming
  {
    name: "The Cab Demon",
    description: "Weekly Challenge: Walk more, ride less! Every walk deals damage.",
    emoji: "🚕",
    sidekickEmoji: "🛺",
    totalHealth: 30000,
    currentHealth: 30000,
    status: "upcoming",
    rewards: { coins: 300, xp: 150 },
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  // MONTHLY BOSS - Active (longer duration, higher rewards)
  {
    name: "The Debt Dragon",
    description: "Monthly Epic: Pay off debts and save consistently to defeat this beast!",
    emoji: "🐉",
    sidekickEmoji: "💰",
    totalHealth: 200000,
    currentHealth: 150000,
    status: "active",
    rewards: { coins: 2000, xp: 1000 },
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
];

// Quests (valid types: savings, spending, streak, social, special)
const QUESTS = [
  {
    title: "Swiggy Shield",
    description: "Don't order food delivery for 3 days",
    type: "spending",
    requirement: { action: "avoid_spending", target: 3 },
    rewards: { coins: 100, xp: 50 },
    difficulty: "easy",
    isActive: true,
  },
  {
    title: "Cab Crusader",
    description: "Take public transport 5 times instead of cabs",
    type: "savings",
    requirement: { action: "save_transport", target: 5 },
    rewards: { coins: 150, xp: 75 },
    difficulty: "medium",
    isActive: true,
  },
  {
    title: "Coffee Conqueror",
    description: "Skip coffee shop visits for 7 days",
    type: "spending",
    requirement: { action: "avoid_spending", target: 7 },
    rewards: { coins: 200, xp: 100 },
    difficulty: "medium",
    isActive: true,
  },
  {
    title: "Weekend Warrior",
    description: "Save ₹500 this weekend",
    type: "savings",
    requirement: { action: "save_amount", target: 500 },
    rewards: { coins: 75, xp: 40 },
    difficulty: "easy",
    isActive: true,
  },
  {
    title: "Streak Master",
    description: "Maintain a 10-day saving streak",
    type: "streak",
    requirement: { action: "streak_days", target: 10 },
    rewards: { coins: 500, xp: 250 },
    difficulty: "hard",
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await BossBattle.deleteMany({});
    await Quest.deleteMany({});
    console.log("✅ Cleared Boss Battles and Quests");

    // Seed Users (upsert by phone)
    console.log("👤 Seeding users...");
    const createdUsers = [];
    for (const userData of TEST_USERS) {
      const user = await User.findOneAndUpdate(
        { phone: userData.phone },
        userData,
        { upsert: true, new: true }
      );
      createdUsers.push(user);
      
      // Create wallets for user if not exist
      const primaryWallet = await Wallet.findOne({ userId: user._id, type: "primary" });
      if (!primaryWallet) {
        await Wallet.create({
          userId: user._id,
          type: "primary",
          balance: userData.kycCompleted ? 10000 : 5000,
        });
      }
      const savingsWallet = await Wallet.findOne({ userId: user._id, type: "savings" });
      if (!savingsWallet) {
        await Wallet.create({
          userId: user._id,
          type: "savings",
          balance: userData.kycCompleted ? 25000 : 5000,
        });
      }
      
      console.log(`  ✅ Created/Updated user: ${userData.name}`);
    }

    // Seed Boss Battles with initial leaderboard entries
    console.log("⚔️ Seeding boss battles...");
    for (const bossData of BOSS_BATTLES) {
      const boss = await BossBattle.create(bossData);
      
      // Add some leaderboard entries for active boss
      if (bossData.status === "active" && createdUsers.length > 0) {
        const damages = [2450, 2100, 1950, 1500, 800];
        for (let i = 0; i < Math.min(createdUsers.length, damages.length); i++) {
          boss.leaderboard.push({
            userId: createdUsers[i]._id,
            damage: damages[i],
          });
        }
        await boss.save();
      }
      console.log(`  ✅ Created boss: ${bossData.name} (${bossData.status})`);
    }

    // Seed Quests and assign some to users
    console.log("📋 Seeding quests...");
    for (const questData of QUESTS) {
      const quest = await Quest.create(questData);
      
      // Assign to first 2 users with random progress
      for (let i = 0; i < Math.min(2, createdUsers.length); i++) {
        quest.assignedUsers.push({
          userId: createdUsers[i]._id,
          progress: Math.floor(Math.random() * questData.requirement.target),
          completed: false,
          assignedAt: new Date(),
        });
      }
      await quest.save();
      console.log(`  ✅ Created quest: ${questData.title}`);
    }

    console.log("\n🎉 Database seeded successfully!");
    console.log(`   Users: ${TEST_USERS.length}`);
    console.log(`   Boss Battles: ${BOSS_BATTLES.length}`);
    console.log(`   Quests: ${QUESTS.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
