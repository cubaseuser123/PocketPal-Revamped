import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import * as Sentry from "@sentry/node";
import swaggerDocs from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bossRoutes from "./routes/bossRoutes.js";
import questRoutes from "./routes/questRoutes.js";
import wheelRoutes from "./routes/wheelRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import badgeRoutes from "./routes/badgeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const startTime = Date.now();

// Sentry Init
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // nodeProfilingIntegration removed due to compatibility issues
  ],
  tracesSampleRate: 1.0,
});

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: true, // Allow all origins in development (mobile apps)
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

// Swagger
swaggerDocs(app);

// MongoDB
connectDB();

// Request logging (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url, "Origin:", req.headers.origin);
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || "development",
  });
});

// Static folder
app.use("/uploads", express.static("uploads"));

// API v1 Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/wallets", walletRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/boss", bossRoutes);
app.use("/api/v1/quests", questRoutes);
app.use("/api/v1/wheel", wheelRoutes);
app.use("/api/v1/friends", friendRoutes);
app.use("/api/v1/badges", badgeRoutes);
app.use("/api/v1/admin", adminRoutes);

// Legacy support: redirect /api/* to /api/v1/*
app.use("/api", (req, res, next) => {
  // Only redirect if not already v1
  if (!req.originalUrl.startsWith("/api/v1")) {
    const newUrl = req.originalUrl.replace("/api", "/api/v1");
    return res.redirect(307, newUrl);
  }
  next();
});

app.get("/", (req, res) => {
  res.send("PocketPal API v1 running");
});

// Sentry Error Handler (v8+)
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

const PORT = process.env.PORT || 5757;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
