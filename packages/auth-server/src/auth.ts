import "dotenv/config";
import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { jwt, bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "./db/index.js";
import { sendOTPViaTwilio, verifyOTPViaTwilio } from "./twilio.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  
  // Allow React Native (no Origin) and specific trusted domains
  trustedOrigins: [
    // Null origin for mobile apps (React Native has no origin)
    null as unknown as string,
    // Mobile App Custom Origin
    "app://pocketpal",
    // Development
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:5757",
    "http://localhost:8081",
    // Production
    "https://pocketpal.app",
  ],

  // User configuration
  user: {
    modelName: "users",
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
      level: {
        type: "number",
        defaultValue: 1,
      },
      coins: {
        type: "number",
        defaultValue: 0,
      },
      friendCode: {
        type: "string",
        required: false,
      },
      kycCompleted: {
        type: "boolean",
        defaultValue: false,
      },
      onboardingCompleted: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  // Use UUID for primary keys (matching existing schema)
  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  plugins: [
    // Phone number authentication with OTP
    phoneNumber({
      otpLength: 6,
      expiresIn: 300, // 5 minutes

      // Send OTP via Twilio Verify
      sendOTP: async ({ phoneNumber: phone }) => {
        await sendOTPViaTwilio(phone);
        console.log(`[Auth] OTP sent to ${phone}`);
      },

      // Verify OTP via Twilio Verify
      verifyOTP: async ({ phoneNumber: phone, code }) => {
        const isValid = await verifyOTPViaTwilio(phone, code);
        return isValid;
      },

      // Allow sign-up with just phone number
      signUpOnVerification: {
        getTempEmail: (phone: string) => `${phone.replace(/\+/g, "")}@pocketpal.temp`,
        getTempName: (phone: string) => `User ${phone.slice(-4)}`,
      },
    }),

    // JWT plugin for stateless token verification by Go backend
    jwt({
      jwt: {
        expirationTime: "7d", // 7 days
      },
    }),

    // Bearer plugin to allow session tokens in Authorization header
    bearer(),
  ],
});

// Export types for client usage
export type Auth = typeof auth;
