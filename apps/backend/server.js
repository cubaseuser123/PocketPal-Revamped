import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import swaggerDocs from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());

// Swagger
swaggerDocs(app);

// MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);


app.get("/", (req, res) => {
  res.send("PocketPal API running");
});

const PORT = process.env.PORT || 5757;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
