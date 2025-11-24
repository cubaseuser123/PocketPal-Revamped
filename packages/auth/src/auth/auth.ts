import { api } from "../api/http";
import { cookies } from "../cookies/cookies";
import { SendOtpProps, VerifyOtpProps } from "../types";

async function sendOtp({ name, email, baseUrl }: SendOtpProps) {
  const response = await api.post(`${baseUrl}/api/auth/send-otp`, {
    name,
    email,
  });
  if (response.status === 200) {
    return response.data.message;
  } else {
    throw new Error("Failed to send OTP");
  }
}

async function verifyOtp({ email, otp, baseUrl }: VerifyOtpProps) {
  const response = await api.post(`${baseUrl}/api/auth/verify-otp`, {
    email,
    otp,
  });

  if (response.status === 200) {
    const { user, token } = response.data;

    await cookies.set("access_token", token, baseUrl);

    return user;
  } else {
    throw new Error("OTP verification failed");
  }
}

async function getCurrentUser(baseUrl: string) {
  const response = await api.get(`${baseUrl}/api/auth/me`);
  if (response.status === 200) {
    return response.data.user;
  } else {
    throw new Error("Failed to fetch current user");
  }
}

async function logoutUser(baseUrl: string) {
  const response = await api.post(`${baseUrl}/api/auth/logout`, {});
  if (response.status !== 200) {
    throw new Error("Logout failed");
  }

  await cookies.clear();
}

export const auth = {
  sendOtp,
  verifyOtp,
  getCurrentUser,
  logoutUser,
};
