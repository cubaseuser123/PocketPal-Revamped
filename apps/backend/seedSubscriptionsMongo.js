// MongoDB Shell Script to seed subscriptions

// Ensure we are using the correct database
db = db.getSiblingDB('pocketpal');

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

const users = db.users.find().toArray();

if (users.length === 0) {
    print("No users found in 'pocketpal' database.");
}

users.forEach(user => {
    const existing = db.subscriptions.countDocuments({ userId: user._id });
    
    if (existing > 0) {
        print(`User ${user.name} already has ${existing} subscriptions. Skipping.`);
        return;
    }
    
    const subsToAdd = user.kycCompleted ? fullKycSubs : minKycSubs;
    
    // Transform for insert
    const subsWithUser = subsToAdd.map(sub => ({
        ...sub,
        userId: user._id,
        createdAt: new Date(),
        updatedAt: new Date()
    }));
    
    db.subscriptions.insertMany(subsWithUser);
    print(`Added ${subsWithUser.length} subscriptions for user: ${user.name} (${user.kycCompleted ? 'Full KYC' : 'Min KYC'})`);
});

print("Seeding completed.");
