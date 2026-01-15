import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import swaggerDocs from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";


const app = express();

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

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url, "Origin:", req.headers.origin);
  next();
});

// Static folder
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("PocketPal API running");
});

const PORT = process.env.PORT || 5757;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
