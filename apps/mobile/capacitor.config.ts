import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pocketpal.mobile",
  appName: "PocketPal",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
