import { Capacitor } from "@capacitor/core";

export const config = {
  backendUrl: Capacitor.isNativePlatform()
    ? import.meta.env.VITE_MOBILE_LOCAL_URL
    : import.meta.env.VITE_BACKEND_URL,
};
