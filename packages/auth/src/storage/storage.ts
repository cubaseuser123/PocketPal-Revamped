import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

const memoryStorage: Map<string, string> = new Map();

export const storage = {
  get: async (key: string): Promise<string | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key });
        console.log(`[Storage] Get ${key} (native):`, !!value);
        return value;
      } else {
        const memValue = memoryStorage.get(key);
        if (memValue) {
          console.log(`[Storage] Get ${key} (memory):`, !!memValue);
          return memValue;
        }

        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue) {
          memoryStorage.set(key, sessionValue);
          console.log(`[Storage] Get ${key} (sessionStorage):`, !!sessionValue);
          return sessionValue;
        }

        return null;
      }
    } catch (error) {
      console.error(`[Storage] Error getting ${key}:`, error);
      return null;
    }
  },

  set: async (
    key: string,
    value: string,
    expiresInDays: number = 30,
  ): Promise<void> => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key, value });
        console.log(`[Storage] Set ${key} (native): success`);
      } else {
        memoryStorage.set(key, value);
        sessionStorage.setItem(key, value);

        const expiryTime = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
        sessionStorage.setItem(`${key}_expiry`, expiryTime.toString());

        console.log(`[Storage] Set ${key} (web/memory): success`);
        console.warn(
          "[Storage] Web storage is vulnerable to XSS. Consider using HttpOnly cookies from backend.",
        );
      }
    } catch (error) {
      console.error(`[Storage] Error setting ${key}:`, error);
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key });
        console.log(`[Storage] Remove ${key} (native): success`);
      } else {
        memoryStorage.delete(key);
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(`${key}_expiry`);
        console.log(`[Storage] Remove ${key} (web): success`);
      }
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.clear();
        console.log("[Storage] Clear all (native): success");
      } else {
        memoryStorage.clear();
        sessionStorage.clear();
        console.log("[Storage] Clear all (web): success");
      }
    } catch (error) {
      console.error("[Storage] Error clearing:", error);
    }
  },

  isExpired: async (key: string): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
      return false;
    }

    const expiryStr = sessionStorage.getItem(`${key}_expiry`);
    if (!expiryStr) return false;

    const expiryTime = parseInt(expiryStr, 10);
    const isExpired = Date.now() > expiryTime;

    if (isExpired) {
      await storage.remove(key);
    }

    return isExpired;
  },

  getAll: async (): Promise<Record<string, string>> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { keys } = await Preferences.keys();
        const result: Record<string, string> = {};

        for (const key of keys) {
          const { value } = await Preferences.get({ key });
          if (value) {
            result[key] = value;
          }
        }
        return result;
      } else {
        const result: Record<string, string> = {};
        memoryStorage.forEach((value, key) => {
          result[key] = value;
        });
        return result;
      }
    } catch (error) {
      console.error("[Storage] Error getting all:", error);
      return {};
    }
  },
};

if (!Capacitor.isNativePlatform() && typeof window !== "undefined") {
  window.addEventListener("load", async () => {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (!key.endsWith("_expiry")) {
        await storage.isExpired(key);
      }
    }
  });
}
