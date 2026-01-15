import mongoose from "mongoose";
import Subscription from "./models/subscription.js";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pocketpal";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

const fullKycSubs = [
    {
        name: "Netflix Premium",
        price: 649,
        category: "Entertainment",
        renewalCycle: "monthly",
        startDate: new Date(),
        nextRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active"
    },
    {
        name: "Spotify Family",
        price: 199,
        category: "Music",
        renewalCycle: "monthly",
        startDate: new Date(),
        nextRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active"
    },
    {
        name: "Gold's Gym",
        price: 2000,
        category: "Health",
        renewalCycle: "monthly",
        startDate: new Date(),
        nextRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active"
    }
];

const minKycSubs = [
    {
        name: "YouTube Premium",
        price: 129,
        category: "Entertainment",
        renewalCycle: "monthly",
        startDate: new Date(),
        nextRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active"
    },
    {
        name: "Amazon Prime",
        price: 1499,
        category: "Shopping",
        renewalCycle: "yearly",
        startDate: new Date(),
        nextRenewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: "active"
    },
    {
        name: "Jio Prepaid",
        price: 299,
        category: "Utilities",
        renewalCycle: "monthly",
        startDate: new Date(),
        nextRenewal: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: "active"
    }
];

const seedSubscriptions = async () => {
    await connectDB();

    try {
        const users = await User.find({});
        
        let addedCount = 0;

        for (const user of users) {
             // Check if user already has subscriptions
             const count = await Subscription.countDocuments({ userId: user._id });
             if (count > 0) {
                 console.log(`User ${user.name} (${user._id}) already has ${count} subscriptions.`);
                 continue;
             }

             const subsToAdd = user.kycCompleted ? fullKycSubs : minKycSubs;
             
             const subsWithUser = subsToAdd.map(sub => ({
                 ...sub,
                 userId: user._id
             }));

             await Subscription.insertMany(subsWithUser);
             addedCount += subsWithUser.length;
             console.log(`Added ${subsWithUser.length} subscriptions for ${user.kycCompleted ? 'Full KYC' : 'Min KYC'} user: ${user.name}`);
        }

        console.log(`Seeding complete. Added ${addedCount} total subscriptions.`);
        process.exit(0);

    } catch (error) {
        console.error("Error seeding:", error);
        process.exit(1);
    }
};

seedSubscriptions();
