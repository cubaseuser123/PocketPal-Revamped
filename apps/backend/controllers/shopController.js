import { db } from "../config/db.js";
import { shopItems, userPurchases, users } from "../drizzle/schema.js";
import { eq, desc, sql, and } from "drizzle-orm";

// ─── Get all active shop items ─────────────────────────────────────
export const getShopItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await db.query.shopItems.findMany({
      where: eq(shopItems.isActive, true),
      orderBy: [desc(shopItems.category), desc(shopItems.price)],
    });

    // Get user's purchases to mark owned items
    const purchases = await db.query.userPurchases.findMany({
      where: eq(userPurchases.userId, userId),
    });
    const purchasedItemIds = new Set(purchases.map((p) => p.itemId));

    // Group by category
    const grouped = {};
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push({
        ...item,
        owned: purchasedItemIds.has(item.id),
      });
    }

    res.json({ categories: grouped, totalItems: items.length });
  } catch (error) {
    console.error("[Shop] Get items error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Purchase an item ──────────────────────────────────────────────
export const purchaseItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Get the item
    const item = await db.query.shopItems.findFirst({
      where: and(eq(shopItems.id, itemId), eq(shopItems.isActive, true)),
    });
    if (!item) {
      return res.status(404).json({ message: "Item not found or no longer available" });
    }

    // Check if already purchased (for non-consumable items like skins)
    const nonConsumable = ["skin", "personality"];
    if (nonConsumable.includes(item.category)) {
      const existing = await db.query.userPurchases.findFirst({
        where: and(
          eq(userPurchases.userId, userId),
          eq(userPurchases.itemId, itemId)
        ),
      });
      if (existing) {
        return res.status(400).json({ message: "You already own this item" });
      }
    }

    // Check coins
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user || user.coins < item.price) {
      return res.status(400).json({ message: "Not enough coins" });
    }

    // Deduct coins atomically
    const [updatedUser] = await db.update(users)
      .set({ coins: sql`${users.coins} - ${item.price}` })
      .where(eq(users.id, userId))
      .returning();

    // Record purchase
    const [purchase] = await db.insert(userPurchases).values({
      userId,
      itemId,
      price: item.price,
    }).returning();

    // Apply special effects based on category
    if (item.category === "extra" && item.name === "Bonus Spin") {
      // Reset last spin date to allow another spin
      await db.update(users)
        .set({ lastSpinDate: null })
        .where(eq(users.id, userId));
    }

    res.json({
      message: `Purchased ${item.emoji} ${item.name}!`,
      purchase,
      remainingCoins: updatedUser.coins,
    });
  } catch (error) {
    console.error("[Shop] Purchase error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get user's purchases ──────────────────────────────────────────
export const getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.id;

    const purchases = await db.query.userPurchases.findMany({
      where: eq(userPurchases.userId, userId),
      with: {
        item: true,
      },
      orderBy: [desc(userPurchases.purchasedAt)],
    });

    res.json({
      purchases: purchases.map((p) => ({
        id: p.id,
        item: p.item,
        price: p.price,
        purchasedAt: p.purchasedAt,
      })),
      totalSpent: purchases.reduce((sum, p) => sum + p.price, 0),
    });
  } catch (error) {
    console.error("[Shop] Purchases error:", error);
    res.status(500).json({ message: error.message });
  }
};
