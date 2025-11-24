import { CapacitorCookies } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";

export const cookies = {
  get: async (key: string): Promise<string | null> => {
    try {
      const map = await CapacitorCookies.getCookies();
      return map[key] ?? null;
    } catch (error) {
      console.error("Error getting cookie:", error);
      return null;
    }
  },

  getAll: async (): Promise<Record<string, string>> => {
    return CapacitorCookies.getCookies();
  },

  clear: async (): Promise<void> => {
    await CapacitorCookies.clearAllCookies();
  },

  set: async (
    key: string,
    value: string,
    url: string,
    expiresInDays: number = 30,
  ): Promise<void> => {
    const platform = Capacitor.getPlatform();

    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    try {
      await CapacitorCookies.setCookie({
        key,
        value,
        url,
        path: "/",
        expires: expires.toISOString(),
      });

      console.log(`Cookie set successfully: ${key} on ${platform}`);
    } catch (error) {
      console.error("Error setting cookie:", error);

      if (platform === "web") {
        document.cookie = `${key}=${value}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        console.log(`Cookie set via document.cookie: ${key}`);
      }
    }
  },
};
