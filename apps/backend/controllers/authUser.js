import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmailOTP } from "../config/sendEmail.js"; // email sender

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// send-otp: create user if not exist, generate OTP, email it
export const sendOTP = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email required" });

    let user = await User.findOne({ email });

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = Date.now() + OTP_TTL_MS;

    if (!user) {
      user = await User.create({
        name,
        email,
        otp: hashedOTP,
        otpExpires: expiresAt,
      });
    } else {
      user.otp = hashedOTP;
      user.otpExpires = expiresAt;
      await user.save();
    }

    // send email
    const send = await sendEmailOTP(email, otp);
    if (!send.success) {
      return res.status(500).json({ message: "Failed to send OTP email", error: send.error });
    }

    return res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("sendOTP error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// verify-otp: verify hashed OTP, issue JWT
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email }).select("+otp +otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired or not present" });
    }

    const isMatch = await bcrypt.compare(otp.toString(), user.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    // create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({ message: "OTP verified", token, user: user.toJSON() });
  } catch (err) {
    console.error("verifyOTP error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// getMe (protected)
export const getMe = async (req, res) => {
  try {
    console.log("🟢 getMe controller reached");

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const logoutUser = (req, res) => {
  return res.json({ message: "Logout successful" });
};
