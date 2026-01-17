// populate.js - Run with mongosh

// 1. Update Harsh Max (already created via curl)
const harshMax = db.users.findOne({ phone: "+919860915237" });
if (harshMax) {
  db.users.updateOne(
    { _id: harshMax._id },
    {
      $set: {
        level: 25,
        coins: 58400,
        kycCompleted: true,
        onboardingCompleted: true,
        role: "user"
      }
    }
  );
  print("✅ Updated Harsh Max");
} else {
  print("❌ Harsh Max not found! Please run curl verify first.");
  quit(1);
}

// 2. Create Harsh Min
let harshMin = db.users.findOne({ phone: "+919130413504" });
if (!harshMin) {
  const res = db.users.insertOne({
    name: "Harsh Min",
    phone: "+919130413504",
    level: 5,
    coins: 2400,
    kycCompleted: false,
    onboardingCompleted: true,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  harshMin = db.users.findOne({ _id: res.insertedId });
  print("✅ Created Harsh Min");
}

// 3. Create Friends
const friends = [
  { name: "Siddharth", level: 18, coins: 15600, kycCompleted: true, phone: "+919000000001" },
  { name: "Riya", level: 22, coins: 32000, kycCompleted: true, phone: "+919000000002" },
  { name: "Arjun", level: 12, coins: 8900, kycCompleted: false, phone: "+919000000003" },
  { name: "Ananya", level: 28, coins: 45000, kycCompleted: true, phone: "+919000000004" }
];

const friendIds = [];
for (const f of friends) {
  let friend = db.users.findOne({ phone: f.phone });
  if (!friend) {
    const res = db.users.insertOne({
      ...f,
      role: "user",
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    friend = db.users.findOne({ _id: res.insertedId });
  }
  friendIds.push(friend);
  print(`✅ Friend: ${f.name}`);
}

// 4. Create Wallets (Function)
function ensureWallets(user) {
  const ppiType = user.kycCompleted ? "full_kyc_ppi" : "small_ppi";
  
  if (!db.wallets.findOne({ userId: user._id, type: "primary" })) {
    db.wallets.insertOne({
      userId: user._id,
      type: "primary",
      ppiType: ppiType,
      balance: Math.floor(Math.random() * 10000),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  if (!db.wallets.findOne({ userId: user._id, type: "savings" })) {
    db.wallets.insertOne({
      userId: user._id,
      type: "savings",
      balance: Math.floor(Math.random() * 50000),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// Create wallets for everyone
ensureWallets(harshMax);
ensureWallets(harshMin);
friendIds.forEach(ensureWallets);
print("✅ Wallets created");

// 5. Friendships
function addFriend(u1, u2) {
  try {
    db.friends.insertOne({ requester: u1._id, recipient: u2._id, status: "accepted", createdAt: new Date(), updatedAt: new Date() });
  } catch(e) {} // Ignore dups
}

// Connect Max to everyone
addFriend(harshMax, harshMin);
friendIds.forEach(f => addFriend(harshMax, f));
print("✅ Friendships established");

// 6. Boss Battles
db.bossbattles.deleteMany({});
const bossId = db.bossbattles.insertOne({
  name: "The Inflation Monster",
  description: "Weekly Boss: Fight rising prices!",
  emoji: "📈",
  sidekickEmoji: "💸",
  totalHealth: 50000,
  currentHealth: 25000,
  status: "active",
  rewards: { coins: 1000, xp: 500 },
  startsAt: new Date(),
  endsAt: new Date(Date.now() + 7 * 86400000),
  leaderboard: [],
  createdAt: new Date(),
  updatedAt: new Date()
}).insertedId;

// Populate Leaderboard
const leaderboard = [];
[harshMax, harshMin, ...friendIds].forEach(u => {
  leaderboard.push({
    userId: u._id,
    damage: Math.floor(Math.random() * 5000) + 500
  });
});

db.bossbattles.updateOne(
  { _id: bossId },
  { $set: { leaderboard: leaderboard.sort((a,b) => b.damage - a.damage) } }
);
print("✅ Boss Battle & Leaderboard created");

// 7. Quests
db.quests.deleteMany({});
const questId = db.quests.insertOne({
  title: "Save ₹500",
  description: "Save ₹500 to earn rewards",
  type: "savings",
  requirement: { action: "save", target: 500 },
  rewards: { coins: 200, xp: 100 },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}).insertedId;
print("✅ Quest created");

print("🎉 POPULATION COMPLETE");
