import { api } from "./http";
import { cookies } from "../cookies/cookies";
import { SendOtpProps, VerifyOtpProps } from "../types";

export const auth = {
  sendOtp: async ({ name, email, baseUrl }: SendOtpProps) => {
    const response = await api.post(`${baseUrl}/auth/send-otp`, {
      name,
      email,
    });

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Failed to send OTP");
    }

    return response.data;
  },

  verifyOtp: async ({ email, otp, baseUrl }: VerifyOtpProps) => {
    const response = await api.post(`${baseUrl}/auth/verify-otp`, {
      email,
      otp,
    });

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Failed to verify OTP");
    }

    const token = response.data?.token || response.data?.access_token;

    if (token) {
      await cookies.set("access_token", token, baseUrl, 30);
      console.log("Token stored successfully");
    } else {
      console.error("No token in response:", response.data);
      throw new Error("No authentication token received");
    }

    return response.data;
  },

  logout: async () => {
    await cookies.clear();
    console.log("All cookies cleared");
  },

  checkAuth: async (): Promise<boolean> => {
    const token = await cookies.get("access_token");
    return !!token;
  },
};
