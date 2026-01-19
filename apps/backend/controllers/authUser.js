import jwt from "jsonwebtoken";
// import { prisma } from "../config/prisma.js";
import { db } from "../config/db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { sendVerificationOTP, checkVerificationOTP } from "../config/sendSms.js";

// send-otp: send OTP via Twilio Verify, name required only for new users
export const sendOTP = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("📱 sendOTP called with body:", req.body);
    }
    
    const { name, phone } = req.body;
    if (!phone) {
      if (process.env.NODE_ENV !== 'production') console.log("❌ Missing phone");
      return res.status(400).json({ message: "Phone required" });
    }

    // Validate phone format
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      if (process.env.NODE_ENV !== 'production') console.log("❌ Invalid phone format:", phone);
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Ensure phone has + prefix
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    if (process.env.NODE_ENV !== 'production') console.log("📞 Formatted phone:", formattedPhone);

    // let user = await prisma.user.findUnique({ where: { phone: formattedPhone } });
    const [existingUser] = await db.select().from(users).where(eq(users.phone, formattedPhone)).limit(1);
    let user = existingUser;
    
    let isNewUser = false;
    if (process.env.NODE_ENV !== 'production') console.log("👤 User found:", !!user);

    // If attempting to register but user exists, return early without sending OTP
    const { action } = req.body;
    if (user && action === 'register') {
      if (process.env.NODE_ENV !== 'production') console.log("⚠️ Registration blocked: User already exists");
      return res.json({
        message: "User already exists",
        isNewUser: false,
        userName: user.name,
      });
    }

    if (!user) {
      // New user - name is required
      if (!name) {
        if (process.env.NODE_ENV !== 'production') console.log("❌ New user but no name provided");
        return res.status(400).json({ message: "Name required for new users", isNewUser: true });
      }
      
      // user = await prisma.user.create({ data: { name, phone: formattedPhone } });
      const [newUser] = await db.insert(users).values({
        name,
        phone: formattedPhone,
      }).returning();
      user = newUser;

      isNewUser = true;
      if (process.env.NODE_ENV !== 'production') console.log("✅ New user created");
    } else if (name && name !== user.name) {
      // Existing user can update their name
      // user = await prisma.user.update({ where: { id: user.id }, data: { name } });
      const [updatedUser] = await db.update(users)
        .set({ name })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser;
      
      if (process.env.NODE_ENV !== 'production') console.log("✅ User name updated");
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log("📤 Sending OTP to:", formattedPhone);
    }
    const result = await sendVerificationOTP(formattedPhone);
    if (process.env.NODE_ENV !== 'production') console.log("📬 Twilio result:", result);
    
    if (!result.success) {
      if (process.env.NODE_ENV !== 'production') console.log("❌ Twilio failed:", result.error);
      return res.status(500).json({ message: "Failed to send OTP", error: result.error });
    }

    if (process.env.NODE_ENV !== 'production') console.log("✅ OTP sent successfully");
    return res.json({ 
      message: "OTP sent to phone",
      isNewUser,
      userName: user.name,
    });
  } catch (err) {
    console.error("❌ sendOTP error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// verify-otp: verify via Twilio Verify API, issue JWT
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required" });

    // Ensure phone has + prefix
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    // Verify OTP via Twilio Verify
    const result = await checkVerificationOTP(formattedPhone, otp.toString());
    if (!result.success) {
      return res.status(400).json({ message: result.error || "Invalid OTP" });
    }

    // Find user
    // const user = await prisma.user.findUnique({ where: { phone: formattedPhone } });
    const [user] = await db.select().from(users).where(eq(users.phone, formattedPhone)).limit(1);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // Create JWT (using UUID id instead of MongoDB _id)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({ message: "OTP verified", token, user });
  } catch (err) {
    console.error("verifyOTP error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// getMe (protected)
export const getMe = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') console.log("🟢 getMe controller reached");

    // const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const logoutUser = (req, res) => {
  return res.json({ message: "Logout successful" });
};
