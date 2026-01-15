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

const bumpUserLevel = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");

    // Find users with "Harsh" in the name AND kycCompleted: true
    const users = await User.find({ 
      name: { $regex: "Harsh", $options: "i" },
      kycCompleted: true 
    });

    if (users.length === 0) {
      console.log("No Full KYC users found with name 'Harsh'");
      process.exit(0);
    }

    console.log(`Found ${users.length} matching users.`);
    
    for (const user of users) {
      console.log(`Updating ${user.name} from Level ${user.level} to Level 16...`);
      user.level = 16;
      // Bonus coins for being a high level user? Let's add some.
      user.coins = (user.coins || 0) + 5000; 
      await user.save();
      console.log(`> Done! New Level: ${user.level}, Coins: ${user.coins}`);
    }

    console.log("Bump complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

bumpUserLevel();
