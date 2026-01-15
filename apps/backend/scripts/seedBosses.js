/**
 * Seed script for Boss Battles
 * Run with: node scripts/seedBosses.js
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import BossBattle from "../models/BossBattle.js";

const bosses = [
  {
    name: "The Impulse Goblin",
    description: "A mischievous creature that tempts you to make impulse purchases. Defeat it by saving consistently!",
    imageUrl: "/uploads/boss-goblin.png",
    totalHealth: 50000,
    currentHealth: 50000,
    rewards: { coins: 100, xp: 500 },
    status: "active",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
  },
  {
    name: "The Debt Dragon",
    description: "A fearsome dragon representing debt and overspending. Band together to defeat this beast!",
    imageUrl: "/uploads/boss-dragon.png",
    totalHealth: 100000,
    currentHealth: 100000,
    rewards: { coins: 250, xp: 1000 },
    status: "upcoming",
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Week 2
  },
];

async function seedBosses() {
  try {
    await connectDB();
    
    // Clear existing bosses
    await BossBattle.deleteMany({});
    console.log("Cleared existing boss battles");
    
    // Insert new bosses
    const created = await BossBattle.insertMany(bosses);
    console.log(`Created ${created.length} boss battles:`);
    created.forEach(b => console.log(`  - ${b.name} (${b.status})`));
    
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seedBosses();
