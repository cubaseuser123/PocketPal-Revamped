import { api } from "../api/http";
import { storage } from "../storage/storage";

interface SendOtpParams {
  name?: string;
  phone: string;
  authUrl: string;  // Better Auth server URL
}

interface VerifyOtpParams {
  phone: string;
  otp: string;
  authUrl: string;  // Better Auth server URL
}

interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  role: string;
  level: number;
  coins: number;
  friendCode: string | null;
  kycCompleted: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VerifyResponse {
  status: boolean;
  token: string;
  user: AuthUser;
}

export const auth = {
  /**
   * Send OTP to phone number via Better Auth
   */
  sendOtp: async ({ name, phone, authUrl }: SendOtpParams): Promise<{ message: string }> => {
    try {
      console.log("[Auth] Sending OTP to:", phone);

      const response = await api.post(`${authUrl}/api/auth/phone-number/send-otp`, {
        phoneNumber: phone,
        name,
      });

      if (response.status !== 200) {
        throw new Error(response.data?.message || "Failed to send OTP");
      }

      console.log("[Auth] OTP sent successfully");
      return response.data;
    } catch (error: any) {
      console.error("[Auth] Send OTP error:", error);
      throw new Error(error.message || "Failed to send OTP");
    }
  },

  /**
   * Verify OTP and get session token via Better Auth
   */
  verifyOtp: async ({
    phone,
    otp,
    authUrl,
  }: VerifyOtpParams): Promise<VerifyResponse> => {
    try {
      console.log("[Auth] Verifying OTP for:", phone);

      const response = await api.post(`${authUrl}/api/auth/phone-number/verify`, {
        phoneNumber: phone,
        code: otp,
      });

      if (response.status !== 200) {
        throw new Error(response.data?.message || "Invalid OTP");
      }

      const data: VerifyResponse = response.data;

      if (!data.token) {
        console.error("[Auth] No token in response:", data);
        throw new Error("Authentication succeeded but no token received");
      }

      await storage.set("access_token", data.token);
      console.log("[Auth] Token stored successfully");
      return data;
    } catch (error: any) {
      console.error("[Auth] Verify OTP error:", error);
      throw new Error(error.message || "Failed to verify OTP");
    }
  },

  /**
   * Get current session from Better Auth
   */
  getSession: async (authUrl: string): Promise<{ user: AuthUser } | null> => {
    try {
      const token = await storage.get("access_token");
      if (!token) return null;

      // The http module automatically adds the Authorization header
      const response = await api.get(`${authUrl}/api/auth/get-session`);

      if (response.status !== 200 || !response.data?.user) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("[Auth] Get session error:", error);
      return null;
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
