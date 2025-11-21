import Subscription from "../models/subscription.js";

// ---------------- Calculate Next Renewal ----------------
const calculateNextRenewal = (startDate, cycle) => {
  const date = new Date(startDate);

  if (cycle === "monthly") date.setMonth(date.getMonth() + 1);
  if (cycle === "yearly") date.setFullYear(date.getFullYear() + 1);
  if (cycle === "weekly") date.setDate(date.getDate() + 7);

  return date;
};

// ---------------- ADD SUBSCRIPTION ----------------
export const addSubscription = async (req, res) => {
  try {
    const { name, price, category, startDate, renewalCycle } = req.body;

    // Validate fields
    if (!name || !price || !startDate) {
      return res.status(400).json({
        message: "Name, price, and start date are required",
      });
    }

    const cycle = renewalCycle || "monthly";
    const nextRenewal = calculateNextRenewal(startDate, cycle);

    const roundOffAmount = Math.ceil(price) - price;

    const subscription = await Subscription.create({
      userId: req.user.id,
      name,
      price,
      category: category || "general",
      startDate,
      renewalCycle: cycle,
      nextRenewal,
      roundOffAmount,
    });

    return res.status(201).json({
      message: "Subscription added successfully",
      subscription,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ---------------- GET ALL SUBSCRIPTIONS ----------------
export const getAllSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user.id })
      .sort({ nextRenewal: 1 });

    return res.json({ subscriptions: subs });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ---------------- GET ACTIVE SUBSCRIPTIONS ----------------
export const getActiveSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({
      userId: req.user.id,
      status: "active",
    }).sort({ nextRenewal: 1 });

    return res.json({ subscriptions: subs });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ---------------- GET UPCOMING SUBSCRIPTIONS ----------------
export const getUpcomingSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({
      userId: req.user.id,
      status: "upcoming",
    }).sort({ startDate: 1 });

    return res.json({ subscriptions: subs });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ---------------- GET CANCELLED SUBSCRIPTIONS ----------------
export const getCancelledSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({
      userId: req.user.id,
      status: "cancelled",
    });

    return res.json({ subscriptions: subs });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ---------------- CANCEL SUBSCRIPTION ----------------
export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found",
      });
    }

    subscription.status = "cancelled";
    await subscription.save();

    return res.json({
      message: "Subscription cancelled successfully",
      subscription,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
