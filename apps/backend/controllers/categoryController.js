// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { categories } from "../drizzle/schema.js";
import { desc, asc } from "drizzle-orm";

// Default categories
const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", emoji: "🍕", color: "#FF6B6B", isDefault: true },
  { name: "Shopping", emoji: "🛒", color: "#4ECDC4", isDefault: true },
  { name: "Transportation", emoji: "🚗", color: "#45B7D1", isDefault: true },
  { name: "Entertainment", emoji: "🎬", color: "#96CEB4", isDefault: true },
  { name: "Bills & Utilities", emoji: "📱", color: "#FFEAA7", isDefault: true },
  { name: "Healthcare", emoji: "🏥", color: "#DDA0DD", isDefault: true },
  { name: "Education", emoji: "📚", color: "#98D8C8", isDefault: true },
  { name: "Other", emoji: "📦", color: "#B8B8B8", isDefault: true },
];

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const allCategories = await db.query.categories.findMany({
        orderBy: [desc(categories.isDefault), asc(categories.name)]
    });
    return res.json({ categories: allCategories });
  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Seed default categories
export const seedCategories = async (req, res) => {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
        // Drizzle upsert
        await db.insert(categories).values(cat)
            .onConflictDoUpdate({
                target: categories.name, // Assuming unique constraint on name
                set: { isDefault: cat.isDefault, color: cat.color, emoji: cat.emoji } // Can create set object dynamically if needed
            });
    }
    const allCategories = await db.query.categories.findMany();
    return res.json({ message: "Categories seeded", categories: allCategories });
  } catch (err) {
    console.error("seedCategories error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
