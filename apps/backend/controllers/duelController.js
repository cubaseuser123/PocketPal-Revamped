import { db } from "../config/db.js";
import { duels, users, friends, transactions } from "../drizzle/schema.js";
import { eq, or, and, desc, gte, sql, inArray } from "drizzle-orm";

const MIN_WAGER = 5;
const MAX_WAGER = 100;
const DUEL_DURATION_DAYS = 7;

// ─── Create a duel challenge ───────────────────────────────────────
export const createDuel = async (req, res) => {
  try {
    const { challengedId, type, wager = 10 } = req.body;
    const challengerId = req.user.id;

    if (!challengedId || !type) {
      return res.status(400).json({ message: "challengedId and type are required" });
    }
    if (challengerId === challengedId) {
      return res.status(400).json({ message: "You can't challenge yourself" });
    }
    if (wager < MIN_WAGER || wager > MAX_WAGER) {
      return res.status(400).json({ message: `Wager must be between ${MIN_WAGER} and ${MAX_WAGER} coins` });
    }

    // Verify friendship
    const friendship = await db.query.friends.findFirst({
      where: and(
        or(
          and(eq(friends.requesterId, challengerId), eq(friends.recipientId, challengedId)),
          and(eq(friends.requesterId, challengedId), eq(friends.recipientId, challengerId))
        ),
        eq(friends.status, "accepted")
      ),
    });
    if (!friendship) {
      return res.status(400).json({ message: "You can only challenge friends" });
    }

    // Verify challenger has enough coins
    const challenger = await db.query.users.findFirst({ where: eq(users.id, challengerId) });
    if (!challenger || challenger.coins < wager) {
      return res.status(400).json({ message: "Not enough coins for this wager" });
    }

    // Check no existing active/pending duel between these two
    const existingDuel = await db.query.duels.findFirst({
      where: and(
        or(
          and(eq(duels.challengerId, challengerId), eq(duels.challengedId, challengedId)),
          and(eq(duels.challengerId, challengedId), eq(duels.challengedId, challengerId))
        ),
        inArray(duels.status, ["pending", "active"])
      ),
    });
    if (existingDuel) {
      return res.status(400).json({ message: "You already have an active duel with this friend" });
    }

    const [newDuel] = await db.insert(duels).values({
      challengerId,
      challengedId,
      type,
      wager,
      status: "pending",
    }).returning();

    res.status(201).json({
      message: "Duel challenge sent!",
      duel: newDuel,
    });
  } catch (error) {
    console.error("[Duel] Create error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Accept or decline a duel ──────────────────────────────────────
export const respondToDuel = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "accept" or "decline"
    const userId = req.user.id;

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Action must be 'accept' or 'decline'" });
    }

    const duel = await db.query.duels.findFirst({ where: eq(duels.id, id) });
    if (!duel) return res.status(404).json({ message: "Duel not found" });
    if (duel.challengedId !== userId) {
      return res.status(403).json({ message: "Only the challenged player can respond" });
    }
    if (duel.status !== "pending") {
      return res.status(400).json({ message: "This duel is no longer pending" });
    }

    if (action === "decline") {
      await db.update(duels)
        .set({ status: "declined", updatedAt: new Date() })
        .where(eq(duels.id, id));
      return res.json({ message: "Duel declined" });
    }

    // Accept: verify both players have enough coins
    const [challenger, challenged] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, duel.challengerId) }),
      db.query.users.findFirst({ where: eq(users.id, userId) }),
    ]);

    if (!challenger || challenger.coins < duel.wager) {
      return res.status(400).json({ message: "Challenger no longer has enough coins" });
    }
    if (!challenged || challenged.coins < duel.wager) {
      return res.status(400).json({ message: "You don't have enough coins for this wager" });
    }

    // Deduct wager from both players + activate duel
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + DUEL_DURATION_DAYS);

    await db.update(users)
      .set({ coins: sql`${users.coins} - ${duel.wager}` })
      .where(eq(users.id, duel.challengerId));

    await db.update(users)
      .set({ coins: sql`${users.coins} - ${duel.wager}` })
      .where(eq(users.id, userId));

    const [updatedDuel] = await db.update(duels)
      .set({ status: "active", startDate, endDate, updatedAt: new Date() })
      .where(eq(duels.id, id))
      .returning();

    res.json({
      message: "Duel accepted! Game on! ⚔️",
      duel: updatedDuel,
    });
  } catch (error) {
    console.error("[Duel] Respond error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get my duels (active + pending) ───────────────────────────────
export const getMyDuels = async (req, res) => {
  try {
    const userId = req.user.id;

    const myDuels = await db.query.duels.findMany({
      where: and(
        or(eq(duels.challengerId, userId), eq(duels.challengedId, userId)),
        inArray(duels.status, ["pending", "active"])
      ),
      with: {
        challenger: { columns: { id: true, name: true, avatarUrl: true, coins: true, level: true } },
        challenged: { columns: { id: true, name: true, avatarUrl: true, coins: true, level: true } },
      },
      orderBy: [desc(duels.createdAt)],
    });

    // Compute live progress for active duels
    const duelsWithProgress = await Promise.all(myDuels.map(async (duel) => {
      if (duel.status === "active" && duel.startDate) {
        const progress = await computeDuelProgress(duel);
        return { ...duel, ...progress };
      }
      return duel;
    }));

    res.json({ duels: duelsWithProgress });
  } catch (error) {
    console.error("[Duel] Get duels error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get single duel detail ────────────────────────────────────────
export const getDuelDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const duel = await db.query.duels.findFirst({
      where: eq(duels.id, id),
      with: {
        challenger: { columns: { id: true, name: true, avatarUrl: true, coins: true, level: true } },
        challenged: { columns: { id: true, name: true, avatarUrl: true, coins: true, level: true } },
        winner: { columns: { id: true, name: true } },
      },
    });

    if (!duel) return res.status(404).json({ message: "Duel not found" });
    if (duel.challengerId !== userId && duel.challengedId !== userId) {
      return res.status(403).json({ message: "Not your duel" });
    }

    // Compute live progress for active duels
    if (duel.status === "active" && duel.startDate) {
      const progress = await computeDuelProgress(duel);
      return res.json({ duel: { ...duel, ...progress } });
    }

    res.json({ duel });
  } catch (error) {
    console.error("[Duel] Detail error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get duel history (W/L record) ─────────────────────────────────
export const getDuelHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const completedDuels = await db.query.duels.findMany({
      where: and(
        or(eq(duels.challengerId, userId), eq(duels.challengedId, userId)),
        eq(duels.status, "completed")
      ),
      with: {
        challenger: { columns: { id: true, name: true, avatarUrl: true } },
        challenged: { columns: { id: true, name: true, avatarUrl: true } },
        winner: { columns: { id: true, name: true } },
      },
      orderBy: [desc(duels.updatedAt)],
      limit: 20,
    });

    const wins = completedDuels.filter((d) => d.winnerId === userId).length;
    const losses = completedDuels.filter((d) => d.winnerId && d.winnerId !== userId).length;
    const draws = completedDuels.filter((d) => !d.winnerId).length;

    res.json({
      history: completedDuels,
      record: { wins, losses, draws, total: completedDuels.length },
    });
  } catch (error) {
    console.error("[Duel] History error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Helper: compute duel progress from transactions ───────────────
async function computeDuelProgress(duel) {
  const { challengerId, challengedId, type, startDate } = duel;

  if (type === "most_saved") {
    // Count savings (income) transactions since startDate
    const [challengerTxns, challengedTxns] = await Promise.all([
      db.select({ total: sql`COALESCE(SUM(ABS(${transactions.amount})), 0)` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, challengerId),
          eq(transactions.type, "income"),
          gte(transactions.createdAt, startDate)
        )),
      db.select({ total: sql`COALESCE(SUM(ABS(${transactions.amount})), 0)` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, challengedId),
          eq(transactions.type, "income"),
          gte(transactions.createdAt, startDate)
        )),
    ]);
    return {
      challengerProgress: Math.round(parseFloat(challengerTxns[0]?.total || 0)),
      challengedProgress: Math.round(parseFloat(challengedTxns[0]?.total || 0)),
    };
  }

  if (type === "fewest_expenses") {
    // Count expense transactions (lower = better, but we still track the count)
    const [challengerCount, challengedCount] = await Promise.all([
      db.select({ count: sql`COUNT(*)` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, challengerId),
          eq(transactions.type, "expense"),
          gte(transactions.createdAt, startDate)
        )),
      db.select({ count: sql`COUNT(*)` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, challengedId),
          eq(transactions.type, "expense"),
          gte(transactions.createdAt, startDate)
        )),
    ]);
    return {
      challengerProgress: parseInt(challengerCount[0]?.count || 0),
      challengedProgress: parseInt(challengedCount[0]?.count || 0),
    };
  }

  // no_spend_streak: count consecutive no-expense days
  return {
    challengerProgress: duel.challengerProgress,
    challengedProgress: duel.challengedProgress,
  };
}
