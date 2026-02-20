import dotenv from "dotenv";
// dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import cors from "cors";
import * as Sentry from "@sentry/node";
import { createProxyMiddleware } from "http-proxy-middleware";
// import rateLimit from "express-rate-limit";
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
import splitGroupRoutes from "./routes/splitGroupRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import duelRoutes from "./routes/duelRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";

// Start cron jobs
import "./jobs/cronJobs.js";

const app = express();
const httpServer = createServer(app);
app.set("trust proxy", 1); // Trust first proxy (fix for rate limit error)
const startTime = Date.now();

// Sentry Init
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // nodeProfilingIntegration removed due to compatibility issues
  ],
  tracesSampleRate: 1.0,
});

// ============ AUTH SERVER PROXY ============
// Proxy /api/auth/* requests to the auth server
const AUTH_SERVER_URL =
  process.env.AUTH_SERVER_URL || "http://127.0.0.1:3001/api/auth";
const authServerBase = AUTH_SERVER_URL.replace(/\/api\/auth\/?$/, ""); // Extract base URL
console.log(
  `[Auth Proxy] Configured to forward /api/auth -> ${authServerBase}/api/auth`,
);

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: authServerBase,
    changeOrigin: true,
    pathRewrite: (path) => `/api/auth${path}`,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(`[Auth Proxy] ${req.method} ${req.originalUrl}`);
      },
      error: (err, req, res) => {
        console.error("[Auth Proxy] Error:", err.message);
        res.status(502).json({ error: "Auth server unavailable" });
      },
    },
  }),
);

// Middlewares
app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000", // Web
  "http://localhost:8081", // Mobile (Expo)
  // Add production domains here
  "https://pocketpal.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          "The CORS policy for this site does not allow access from the specified Origin.",
        ),
        false,
      );
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join_group", (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Rate Limiter for Auth
/*
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: "Too many login attempts, please try again later"
});
*/

// Stricter limiter for OTP
/*
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 OTP requests per hour
  message: "Too many OTP requests, please try again later"
});
*/

// Swagger
swaggerDocs(app);

// Database Connection
// Database Connection
const checkAvailable = async () => {
  try {
    await import("./config/db.js");
    console.log("PostgreSQL Connected successfully via Drizzle");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};
checkAvailable();

// Request logging (disabled in production)
if (process.env.NODE_ENV !== "production") {
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
// app.use("/api/v1/auth/send-otp", otpLimiter); // Apply specifically to OTP (Handled in router now)
app.use("/api/v1/auth", /* authLimiter, */ authRoutes); // Apply general auth limit
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
app.use("/api/v1/split-groups", splitGroupRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/duels", duelRoutes);
app.use("/api/v1/shop", shopRoutes);

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

// app.listen(PORT, () => {
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} host 0.0.0.0`);
});
