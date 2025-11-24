import { api } from "../api/http";
import { storage } from "../storage/storage";

interface SendOtpParams {
  name: string;
  email: string;
  baseUrl: string;
}

interface VerifyOtpParams {
  email: string;
  otp: string;
  baseUrl: string;
}

interface AuthResponse {
  token?: string;
  access_token?: string;
  accessToken?: string;
}

export const auth = {
  sendOtp: async ({ name, email, baseUrl }: SendOtpParams): Promise<void> => {
    try {
      console.log("[Auth] Sending OTP to:", email);

      const response = await api.post(`${baseUrl}/auth/send-otp`, {
        name,
        email,
      });

      if (response.status !== 200) {
        throw new Error(response.data?.message || "Failed to send OTP");
      }

      console.log("[Auth] OTP sent successfully");
    } catch (error: any) {
      console.error("[Auth] Send OTP error:", error);
      throw new Error(error.message || "Failed to send OTP");
    }
  },

  verifyOtp: async ({
    email,
    otp,
    baseUrl,
  }: VerifyOtpParams): Promise<void> => {
    try {
      console.log("[Auth] Verifying OTP for:", email);

      const response = await api.post(`${baseUrl}/auth/verify-otp`, {
        email,
        otp,
      });

      if (response.status !== 200) {
        throw new Error(response.data?.message || "Invalid OTP");
      }

      const data: AuthResponse = response.data;
      const token = data.token || data.access_token || data.accessToken;

      if (!token) {
        console.error("[Auth] No token in response:", data);
        throw new Error("Authentication succeeded but no token received");
      }

      await storage.set("access_token", token);
      console.log("[Auth] Token stored successfully");
    } catch (error: any) {
      console.error("[Auth] Verify OTP error:", error);
      throw new Error(error.message || "Failed to verify OTP");
    }
  },

  logout: async (): Promise<void> => {
    try {
      console.log("[Auth] Logging out...");
      await storage.remove("access_token");
      console.log("[Auth] Token removed successfully");
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await storage.get("access_token");
      const isAuth = !!token;
      console.log("[Auth] Is authenticated:", isAuth);
      return isAuth;
    } catch (error) {
      console.error("[Auth] Auth check error:", error);
      return false;
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await storage.get("access_token");
    } catch (error) {
      console.error("[Auth] Get token error:", error);
      return null;
    }
  },
};
