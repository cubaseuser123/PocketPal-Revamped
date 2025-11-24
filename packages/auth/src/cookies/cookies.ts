import { CapacitorCookies } from "@capacitor/core";

export const cookies = {
  get: async (key: string): Promise<string | null> => {
    const map = await CapacitorCookies.getCookies();
    return map[key] ?? null;
  },

  getAll: async (): Promise<Record<string, string>> => {
    return CapacitorCookies.getCookies();
  },

  clear: async (): Promise<void> => {
    await CapacitorCookies.clearAllCookies();
  },

  set: async (key: string, value: string, url: string): Promise<void> => {
    await CapacitorCookies.setCookie({
      key,
      value,
      url,
    });
  },
};
