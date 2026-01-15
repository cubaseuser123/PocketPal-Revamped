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

const checkAvatar = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected");

    const users = await User.find({ name: { $regex: "Harsh", $options: "i" } });

    if (users.length === 0) {
      console.log("No users found.");
    } else {
      users.forEach(u => {
        console.log(`User: ${u.name}, Level: ${u.level}`);
        console.log(`AvatarURL: '${u.avatarUrl}'`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkAvatar();
