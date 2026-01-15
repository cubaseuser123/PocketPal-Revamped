import express from "express";
import { getCategories, seedCategories } from "../controllers/categoryController.js";

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all spending categories
 */
router.get("/", getCategories);

/**
 * @swagger
 * /api/categories/seed:
 *   post:
 *     tags: [Categories]
 *     summary: Seed default categories
 */
router.post("/seed", seedCategories);

export default router;
