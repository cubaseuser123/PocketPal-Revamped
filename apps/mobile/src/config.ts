import { Capacitor } from "@capacitor/core";

export const config = {
  backendUrl: Capacitor.isNativePlatform()
    ? `${process.env.VITE_MOBILE_LOCAL_URL}`
    : `${process.env.VITE_BACKEND_URL}`,
};
