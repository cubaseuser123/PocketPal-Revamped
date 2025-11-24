import { Capacitor } from "@capacitor/core";

export const config = {
  backendUrl: Capacitor.isNativePlatform()
    ? "http://10.190.181.124:5757"
    : "http://localhost:5757",
};
