import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";

export { auth, type Auth } from "./auth.js";
export { sendOTPViaTwilio, verifyOTPViaTwilio } from "./twilio.js";
export const authHandler = toNodeHandler(auth);
