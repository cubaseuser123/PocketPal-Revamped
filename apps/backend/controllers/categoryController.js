import Category from "../models/Category.js";

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ isDefault: -1, name: 1 });
    return res.json({ categories });
  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Seed default categories
export const seedCategories = async (req, res) => {
  try {
    await Category.seedDefaults();
    const categories = await Category.find();
    return res.json({ message: "Categories seeded", categories });
  } catch (err) {
    console.error("seedCategories error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
