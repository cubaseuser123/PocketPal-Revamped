import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Config to load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pocketpal";

const fixUserLevel = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");

    // Find users with "Harsh" in the name
    const users = await User.find({ name: { $regex: "Harsh", $options: "i" } });

    if (users.length === 0) {
      console.log("No users found with name 'Harsh'");
      process.exit(0);
    }

    console.log(`Found ${users.length} users matching 'Harsh':`);
    
    for (const user of users) {
      console.log(`- ${user.name} (Current Level: ${user.level}, KYC: ${user.kycCompleted})`);
      
      // Update if KYC is completed but level is 1
      if (user.kycCompleted && user.level < 2) {
        console.log(`  > Updating ${user.name} to Level 2...`);
        user.level = 2;
        user.coins = (user.coins || 0) + 500; // Award missing XP
        await user.save();
        console.log(`  > Done! New Level: ${user.level}, Coins: ${user.coins}`);
      } else {
        console.log(`  > No update needed.`);
      }
    }

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

fixUserLevel();
