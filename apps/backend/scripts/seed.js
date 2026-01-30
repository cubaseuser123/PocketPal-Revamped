
import { db } from "../config/db.js";
import { 
  users, 
  friends, 
  bossBattles, 
  quests, 
  goals, 
  wallets, 
  transactions,
  bossStatus,
  friendStatus,
  questType,
  questDifficulty,
  transactionType,
  walletType,
  userBadges,
  bossBattleLeaderboard,
  questAssignments
} from "../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

const TARGET_PHONE = "+919860915237"; // Assuming +91 from previous context, or just matching the number if stored without country code. 
// The verify.tsx code adds + if missing, formattedPhone usually has +. Let's assume +91 or try to match loose.
// Actually user said "9860915237", in Indian context usually +91.

const seedDatabase = async () => {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. LOCATE OR CREATE MAIN USER
    console.log(`🔍 Looking for user with phone: ${TARGET_PHONE}...`);
    // Try with and without +91 just in case
    let mainUser = await db.query.users.findFirst({
        where: (users, { eq, or }) => or(eq(users.phone, TARGET_PHONE), eq(users.phone, `+91${TARGET_PHONE.replace(/^\+91/, '')}`))
    });

    if (!mainUser) {
      console.log("⚠️ User not found. Creating main user...");
      const [newUser] = await db.insert(users).values({
        name: "Harsh Kapse",
        phone: `+91${TARGET_PHONE.replace(/^\+91/, '')}`, // Ensure +91 format
        level: 1,
        coins: 0,
      }).returning();
      mainUser = newUser;
    }

    console.log(`👤 Main User: ${mainUser.name} (${mainUser.id})`);

    // 2. UPDATE USER STATS
    console.log("📈 Updating user stats (Level 25, 5000 Coins)...");
    await db.update(users)
      .set({ 
        level: 25, 
        coins: 5000,
        totalGoalsCompleted: 12
      })
      .where(eq(users.id, mainUser.id));

    // 3. UPDATE WALLETS
    console.log("💰 Updating wallet balances...");
    // Check for primary wallet
    let primaryWallet = await db.query.wallets.findFirst({
        where: and(eq(wallets.userId, mainUser.id), eq(wallets.type, 'primary'))
    });

    if (primaryWallet) {
        await db.update(wallets)
            .set({ balance: '25000.00' }) // String for numeric/decimal type
            .where(eq(wallets.id, primaryWallet.id));
    } else {
        await db.insert(wallets).values({
            userId: mainUser.id,
            type: 'primary',
            balance: '25000.00'
        });
    }

    // Check for savings wallet
    let savingsWallet = await db.query.wallets.findFirst({
        where: and(eq(wallets.userId, mainUser.id), eq(wallets.type, 'savings'))
    });

    if (savingsWallet) {
        await db.update(wallets)
            .set({ balance: '150000.00' })
            .where(eq(wallets.id, savingsWallet.id));
    } else {
        await db.insert(wallets).values({
            userId: mainUser.id,
            type: 'savings',
            balance: '150000.00'
        });
    }

    // 4. CREATE GOALS
    console.log("🎯 Creating goals...");
    // Clear existing goals for clean state? Or just add new ones? 
    // Let's add new ones if not present.
    const goalData = [
        { name: "New Macbook Pro", target: "200000", current: "120000", emoji: "💻", color: "#3B82F6", category: "Tech" },
        { name: "Europe Trip", target: "350000", current: "50000", emoji: "✈️", color: "#8B5CF6", category: "Travel" },
        { name: "Emergency Fund", target: "100000", current: "100000", emoji: "🏥", color: "#10B981", category: "Savings", isCompleted: true },
        { name: "Gaming Setup", target: "150000", current: "25000", emoji: "🎮", color: "#EF4444", category: "Gaming" }
    ];

    for (const g of goalData) {
        const existing = await db.query.goals.findFirst({
            where: and(eq(goals.userId, mainUser.id), eq(goals.name, g.name))
        });
        if (!existing) {
            await db.insert(goals).values({
                userId: mainUser.id,
                name: g.name,
                targetAmount: g.target,
                currentAmount: g.current,
                emoji: g.emoji,
                color: g.color,
                category: g.category,
                isCompleted: g.isCompleted || false
            });
        }
    }

    // 5. CREATE DUMMY FRIENDS
    console.log("🤝 Creating friends...");
    const dummyUsers = [
        { name: "Rahul Sharma", phone: "+919876543210" },
        { name: "Priya Patel", phone: "+919876543211" },
        { name: "Amit Verma", phone: "+919876543212" },
        { name: "Sneha Gupta", phone: "+919876543213" },
        { name: "Vikram Singh", phone: "+919876543214" }
    ];

    for (const u of dummyUsers) {
        // Find or create dummy user
        let friendUser = await db.query.users.findFirst({ where: eq(users.phone, u.phone) });
        if (!friendUser) {
            const [newUser] = await db.insert(users).values({
                name: u.name,
                phone: u.phone,
                level: Math.floor(Math.random() * 10) + 1,
                coins: Math.floor(Math.random() * 1000),
                onboardingCompleted: true,
                kycCompleted: Math.random() > 0.5,
                friendCode: `FC-${Math.floor(100000 + Math.random() * 900000)}` 
            }).returning();
            friendUser = newUser;

            // Create wallets for friend
            await db.insert(wallets).values([
                {
                    userId: friendUser.id,
                    type: 'primary',
                    balance: (Math.random() * 50000).toFixed(2)
                },
                {
                    userId: friendUser.id,
                    type: 'savings',
                    balance: (Math.random() * 100000).toFixed(2)
                }
            ]);
        }

        // Create friendship
        const existingFriendship = await db.query.friends.findFirst({
            where: (friends, { or, and, eq }) => or(
                and(eq(friends.requesterId, mainUser.id), eq(friends.recipientId, friendUser.id)),
                and(eq(friends.requesterId, friendUser.id), eq(friends.recipientId, mainUser.id))
            )
        });

        if (!existingFriendship) {
            await db.insert(friends).values({
                requesterId: mainUser.id,
                recipientId: friendUser.id,
                status: 'accepted'
            });
        }
    }

    // 6. BOSS BATTLES
    console.log("👾 Creating Boss Battles...");
    const bosses = [
        {
            name: "Inflation Dragon",
            description: "The classic enemy of savings. Defeat it by saving consistently!",
            emoji: "🐲",
            totalHealth: 50000,
            currentHealth: 25000,
            status: 'active',
            rewardCoins: 500,
            rewardXp: 1000
        },
        {
            name: "Impulse Buy Imp",
            description: "A tricky little devil that makes you spend on things you don't need.",
            emoji: "😈",
            totalHealth: 10000,
            currentHealth: 10000,
            status: 'upcoming',
            rewardCoins: 200,
            rewardXp: 400
        }
    ];

    for (const b of bosses) {
        const existing = await db.query.bossBattles.findFirst({ where: eq(bossBattles.name, b.name) });
        if (!existing) {
            await db.insert(bossBattles).values(b);
        }
    }

    // 7. QUESTS
    console.log("📜 Creating Quests...");
    const questList = [
        {
            title: "Save ₹500 today",
            description: "Transfer ₹500 to your savings wallet.",
            type: "savings",
            difficulty: "easy",
            rewardCoins: 50,
            rewardXp: 100,
            requirementTarget: 500,
            isActive: true
        },
        {
            title: "Zero Spend Day",
            description: "Don't make any expense transactions today.",
            type: "spending",
            difficulty: "medium",
            rewardCoins: 100,
            rewardXp: 200,
            isActive: true
        },
        {
            title: "Social Saver",
            description: "Create a Split Group with friends.",
            type: "social",
            difficulty: "medium",
            rewardCoins: 75,
            rewardXp: 150,
            isActive: true
        }
    ];

    for (const q of questList) {
        const existing = await db.query.quests.findFirst({ where: eq(quests.title, q.title) });
        if (!existing) {
            await db.insert(quests).values(q);
        }
    }
    
    // 8. AWARD BADGES TO MAIN USER
    console.log("🏅 Awarding Badges...");
    const badgeList = ["saver_starter", "high_roller"];
    for (const bId of badgeList) {
        // Check if exists
        const existingBadge = await db.query.userBadges.findFirst({
            where: and(eq(userBadges.userId, mainUser.id), eq(userBadges.badgeId, bId))
        });
        if (!existingBadge) {
             await db.insert(userBadges).values({
                 userId: mainUser.id,
                 badgeId: bId
             });
        }
    }

    // 9. UPDATE LEADERBOARD
    console.log("🏆 Updating Leaderboard...");
    // Get the active boss battle
    const activeBattle = await db.query.bossBattles.findFirst({
        where: eq(bossBattles.status, 'active')
    });

    if (activeBattle) {
        // Add main user
        const existingEntry = await db.query.bossBattleLeaderboard.findFirst({
             where: and(eq(bossBattleLeaderboard.battleId, activeBattle.id), eq(bossBattleLeaderboard.userId, mainUser.id))
        });
        if (!existingEntry) {
            await db.insert(bossBattleLeaderboard).values({
                battleId: activeBattle.id,
                userId: mainUser.id,
                damage: 5000
            });
        }

        // Add dummy friends to leaderboard
        const friendsList = await db.query.friends.findMany({
            where: eq(friends.requesterId, mainUser.id),
            with: {
                user_recipientId: true
            }
        });

        for (const f of friendsList) {
             const fUser = f.user_recipientId;
             const fEntry = await db.query.bossBattleLeaderboard.findFirst({
                 where: and(eq(bossBattleLeaderboard.battleId, activeBattle.id), eq(bossBattleLeaderboard.userId, fUser.id))
            });
            if (!fEntry) {
                await db.insert(bossBattleLeaderboard).values({
                    battleId: activeBattle.id,
                    userId: fUser.id,
                    damage: Math.floor(Math.random() * 4000)
                });
            }
        }
    }

    // 10. QUEST ASSIGNMENTS
    console.log("📝 Assigning Quests...");
    const allQuests = await db.query.quests.findMany();
    for (const q of allQuests) {
        const existingAssignment = await db.query.questAssignments.findFirst({
            where: and(eq(questAssignments.questId, q.id), eq(questAssignments.userId, mainUser.id))
        });
        
        if (!existingAssignment) {
            const isCompleted = Math.random() > 0.7;
            await db.insert(questAssignments).values({
                questId: q.id,
                userId: mainUser.id,
                progress: isCompleted ? (q.requirementTarget || 1) : 0,
                completed: isCompleted,
                completedAt: isCompleted ? new Date() : null
            });
        }
    }

    console.log("✅ Seeding completed successfully!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
