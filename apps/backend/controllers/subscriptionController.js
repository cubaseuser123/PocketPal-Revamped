// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { subscriptions } from "../drizzle/schema.js";
import { eq, and, asc } from "drizzle-orm";

// Calculate Next Renewal
const calculateNextRenewal = (startDate, cycle) => {
  const date = new Date(startDate);

  if (cycle === "monthly") date.setMonth(date.getMonth() + 1);
  if (cycle === "yearly") date.setFullYear(date.getFullYear() + 1);
  if (cycle === "weekly") date.setDate(date.getDate() + 7);

  return date;
};

// ADD SUBSCRIPTION
export const addSubscription = async (req, res) => {
  try {
    const { name, price, category, startDate, renewalCycle } = req.body;

    if (!name || !price || !startDate) {
      return res.status(400).json({
        message: "Name, price, and start date are required",
      });
    }

    const cycle = renewalCycle || "monthly";
    const nextRenewal = calculateNextRenewal(startDate, cycle);
    const roundOffAmount = Math.ceil(price) - price;

    const [subscription] = await db.insert(subscriptions).values({
        userId: req.user.id,
        name,
        price,
        category: category || "general",
        startDate: new Date(startDate),
        renewalCycle: cycle,
        nextRenewal,
        roundOffAmount,
        status: "active", // Default? Schema says default 'active'.
        // But let's be explicit if needed. Or just rely on default.
    }).returning();

    return res.status(201).json({
      message: "Subscription added successfully",
      subscription: { ...subscription, price: Number(subscription.price) },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET ALL SUBSCRIPTIONS
export const getAllSubscriptions = async (req, res) => {
  try {
    const subs = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, req.user.id),
      orderBy: [asc(subscriptions.nextRenewal)],
    });

    return res.json({ 
      subscriptions: subs.map(s => ({ ...s, price: Number(s.price) })),
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET ACTIVE SUBSCRIPTIONS
export const getActiveSubscriptions = async (req, res) => {
  try {
    const subs = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.userId, req.user.id),
        eq(subscriptions.status, "active")
      ),
      orderBy: [asc(subscriptions.nextRenewal)],
    });

    return res.json({ 
      subscriptions: subs.map(s => ({ ...s, price: Number(s.price) })),
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET UPCOMING SUBSCRIPTIONS
export const getUpcomingSubscriptions = async (req, res) => {
  try {
    // "upcoming" status logic? 
    // Prisma code: where: { status: "upcoming" }
    // Schema likely has 'upcoming' in enum, or user meant "active" but sorted by start date? 
    // The previous code explicitly checked `status: "upcoming"`.
    const subs = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.userId, req.user.id),
        eq(subscriptions.status, "upcoming")
      ),
      orderBy: [asc(subscriptions.startDate)],
    });

    return res.json({ 
      subscriptions: subs.map(s => ({ ...s, price: Number(s.price) })),
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET CANCELLED SUBSCRIPTIONS
export const getCancelledSubscriptions = async (req, res) => {
  try {
    const subs = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.userId, req.user.id),
        eq(subscriptions.status, "cancelled")
      ),
    });

    return res.json({ 
      subscriptions: subs.map(s => ({ ...s, price: Number(s.price) })),
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// CANCEL SUBSCRIPTION
export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.id, id),
        eq(subscriptions.userId, req.user.id)
      ),
    });

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found",
      });
    }

    const [updated] = await db.update(subscriptions)
      .set({ status: "cancelled" })
      .where(eq(subscriptions.id, id))
      .returning();

    return res.json({
      message: "Subscription cancelled successfully",
      subscription: { ...updated, price: Number(updated.price) },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
