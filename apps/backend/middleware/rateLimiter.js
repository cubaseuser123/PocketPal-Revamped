import rateLimit from "express-rate-limit";

// OTP Rate Limiter - 5 requests per 30 minutes per IP
export const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 30,
  message: {
    message: "Too many OTP requests. Please try again after 30 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
