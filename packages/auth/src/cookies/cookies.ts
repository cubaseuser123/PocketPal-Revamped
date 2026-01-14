import { Platform } from "react-native";

const isNative = Platform.OS === "ios" || Platform.OS === "android";

// Cookie helper for web only - native apps should use secure storage for tokens
export const cookies = {
  get: async (key: string): Promise<string | null> => {
    try {
      if (isNative) {
        console.warn("[Cookies] Cookies not available on native. Use storage instead.");
        return null;
      }

      if (typeof document === "undefined") return null;

      const value = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${key}=`))
        ?.split("=")[1];

      return value ?? null;
    } catch (error) {
      console.error("Error getting cookie:", error);
      return null;
    }
  },

  getAll: async (): Promise<Record<string, string>> => {
    if (isNative || typeof document === "undefined") {
      return {};
    }

    const result: Record<string, string> = {};
    document.cookie.split("; ").forEach((cookie) => {
      const [key, value] = cookie.split("=");
      if (key && value) {
        result[key] = value;
      }
    });
    return result;
  },

  clear: async (): Promise<void> => {
    if (isNative || typeof document === "undefined") {
      return;
    }

    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key] = cookie.split("=");
      if (key) {
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    }
  },

  set: async (
    key: string,
    value: string,
    _url: string,
    expiresInDays: number = 30,
  ): Promise<void> => {
    if (isNative) {
      console.warn("[Cookies] Cookies not available on native. Use storage instead.");
      return;
    }

    if (typeof document === "undefined") return;

    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    try {
      document.cookie = `${key}=${value}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      console.log(`Cookie set successfully: ${key}`);
    } catch (error) {
      console.error("Error setting cookie:", error);
    }
  },
};

