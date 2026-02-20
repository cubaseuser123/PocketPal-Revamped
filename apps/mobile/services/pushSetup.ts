import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { API_URL } from "../hooks/useUser";
import { storage } from "@repo/auth";

type NotificationsModule = typeof import("expo-notifications");

// Expo Go does not support remote notifications in SDK 53+
const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

let notificationsModulePromise: Promise<NotificationsModule> | null = null;

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (isExpoGo) return null;

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications").then((mod) => {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      return mod;
    });
  }

  return notificationsModulePromise;
}

/**
 * Register for push notifications and save token to backend
 * Note: Push notifications require a development build (not Expo Go) in SDK 53+
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Expo Go doesn't support push notifications in SDK 53+
  if (isExpoGo) {
    console.log("[Push] Skipping - Push notifications not supported in Expo Go (SDK 53+). Use a development build.");
    return null;
  }

  // Only works on physical devices
  if (!Device.isDevice) {
    console.log("[Push] Skipping - Push notifications only work on physical devices");
    return null;
  }

  // Check/request permissions
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Permission denied");
    return null;
  }

  // Get the Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "512aff5f-3032-4c4d-bee2-a674e5c4c612",
    });
    const token = tokenData.data;

    // Save token to backend
    const authToken = await storage.get("access_token");
    if (authToken) {
      await fetch(`${API_URL}/api/v1/user/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ expoPushToken: token }),
      });
    }

    console.log("[Push] Token registered:", token);
    return token;
  } catch (error) {
    console.error("[Push] Failed to register:", error);
    return null;
  }
}

/**
 * Handle notification received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: any) => void
) {
  if (isExpoGo) return null;
  import("expo-notifications")
    .then((Notifications) => Notifications.addNotificationReceivedListener(callback))
    .catch(() => null);
  return null;
}

/**
 * Handle notification tap
 */
export function addNotificationResponseListener(
  callback: (response: any) => void
) {
  if (isExpoGo) return null;
  import("expo-notifications")
    .then((Notifications) =>
      Notifications.addNotificationResponseReceivedListener(callback),
    )
    .catch(() => null);
  return null;
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number) {
  if (Platform.OS === "ios" && !isExpoGo) {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(count);
  }
}
