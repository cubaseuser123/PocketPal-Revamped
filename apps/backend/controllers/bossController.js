// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { bossBattles, bossBattleLeaderboard, users } from "../drizzle/schema.js";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

// Get current active boss battle
export const getActiveBoss = async (req, res) => {
  try {
    const boss = await db.query.bossBattles.findFirst({
      where: eq(bossBattles.status, "active"),
    });
    
    if (!boss) {
      return res.status(404).json({ message: "No active boss battle" });
    }

    // Get leaderboard
    const leaderboard = await db.query.bossBattleLeaderboard.findMany({
      where: eq(bossBattleLeaderboard.battleId, boss.id),
      orderBy: [desc(bossBattleLeaderboard.damage)],
      limit: 10,
      with: {
        user: true, // Relation to user
      },
    });
    
    res.json({
      ...boss,
      totalHealth: Number(boss.totalHealth),
      currentHealth: Number(boss.currentHealth),
      rewardCoins: Number(boss.rewardCoins),
      rewardXp: Number(boss.rewardXp),
      leaderboard: leaderboard.map(l => ({
        id: l.user.id,
        name: l.user.name,
        avatarUrl: l.user.avatarUrl,
        damage: Number(l.damage),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leaderboard for a boss
export const getLeaderboard = async (req, res) => {
  try {
    const { bossId } = req.params;
    
    const boss = await db.query.bossBattles.findFirst({ where: eq(bossBattles.id, bossId) });
    if (!boss) {
      return res.status(404).json({ message: "Boss not found" });
    }

    const leaderboard = await db.query.bossBattleLeaderboard.findMany({
      where: eq(bossBattleLeaderboard.battleId, bossId),
      orderBy: [desc(bossBattleLeaderboard.damage)],
      with: {
        user: true,
      },
    });
    
    res.json(leaderboard.map(l => ({
      userId: l.userId,
      id: l.user.id,
      name: l.user.name,
      avatarUrl: l.user.avatarUrl,
      damage: Number(l.damage),
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deal damage to boss
export const dealDamage = async (req, res) => {
  try {
    const { bossId } = req.params;
    let { amount } = req.body;
    const userId = req.user.id;

    // Security: Cap damage to prevent cheating
    const MAX_DAMAGE_PER_HIT = 100;
    if (amount > MAX_DAMAGE_PER_HIT) {
      amount = MAX_DAMAGE_PER_HIT;
    }

    const result = await db.transaction(async (tx) => {
      const boss = await tx.query.bossBattles.findFirst({ where: eq(bossBattles.id, bossId) });
      if (!boss) {
        throw new Error("Boss not found");
      }
      
      if (boss.status !== "active") {
        throw new Error("Boss is not active");
      }

      // Update boss health
      const newHealth = Math.max(0, Number(boss.currentHealth) - amount);
      const defeated = newHealth <= 0;

      await tx.update(bossBattles)
        .set({
          currentHealth: newHealth,
          ...(defeated && { status: "defeated" }),
        })
        .where(eq(bossBattles.id, bossId));

      // Update or create leaderboard entry
      const existing = await tx.query.bossBattleLeaderboard.findFirst({
        where: and(
            eq(bossBattleLeaderboard.battleId, bossId),
            eq(bossBattleLeaderboard.userId, userId)
        ),
      });

      if (existing) {
        await tx.update(bossBattleLeaderboard)
          .set({ damage: sql`${bossBattleLeaderboard.damage} + ${amount}` })
          .where(eq(bossBattleLeaderboard.id, existing.id));
      } else {
        await tx.insert(bossBattleLeaderboard).values({
            battleId: bossId,
            userId,
            damage: amount
        });
      }

      // If defeated, award coins to participants
      if (defeated && boss.rewardCoins > 0) {
        const participants = await tx.query.bossBattleLeaderboard.findMany({
          where: eq(bossBattleLeaderboard.battleId, bossId),
        });
        
        const participantIds = participants.map(p => p.userId);
        if (participantIds.length > 0) {
          await tx.update(users)
            .set({ coins: sql`${users.coins} + ${boss.rewardCoins}` })
            .where(inArray(users.id, participantIds));
        }
      }

      return { currentHealth: newHealth, defeated };
    });
    
    res.json({
      currentHealth: result.currentHealth,
      defeated: result.defeated,
      message: result.defeated ? "Boss defeated! Rewards distributed." : "Damage dealt!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new boss battle (admin)
export const createBoss = async (req, res) => {
  try {
    const { name, description, imageUrl, totalHealth, rewardCoins, rewardXp, startsAt, endsAt } = req.body;
    
    const [boss] = await db.insert(bossBattles).values({
        name,
        description,
        imageUrl,
        totalHealth,
        currentHealth: totalHealth,
        rewardCoins: rewardCoins || 0,
        rewardXp: rewardXp || 0,
        status: "upcoming",
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
    }).returning();
    
    res.status(201).json({
      ...boss,
      totalHealth: Number(boss.totalHealth),
      currentHealth: Number(boss.currentHealth),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate a boss battle
export const activateBoss = async (req, res) => {
  try {
    const { bossId } = req.params;
    
    // Deactivate any currently active boss
    await db.update(bossBattles)
      .set({ status: "defeated" }) // or whatever logic was before, previously "defeated" if overwriting active? yes.
      .where(eq(bossBattles.status, "active"));
    
    const [boss] = await db.update(bossBattles)
      .set({ status: "active" })
      .where(eq(bossBattles.id, bossId))
      .returning();
    
    res.json({
      ...boss,
      totalHealth: Number(boss.totalHealth),
      currentHealth: Number(boss.currentHealth),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
