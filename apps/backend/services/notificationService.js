import { db } from "../config/db.js";
import { users, notifications } from "../drizzle/schema.js";
import { eq, desc, and } from "drizzle-orm";

const EXPO_PUSH_URL = "https://api.expo.dev/v2/push/send";

/**
 * Send push notification via Expo
 */
export async function sendPushNotification(userId, title, body) {
  try {
    // Get user's push token
    const [user] = await db
      .select({ expoPushToken: users.expoPushToken })
      .from(users)
      .where(eq(users.id, userId));

    if (!user?.expoPushToken) {
      console.log(`[Push] No push token for user ${userId}`);
      return false;
    }

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: user.expoPushToken,
        title,
        body,
        sound: "default",
        priority: "high",
        data: { userId, screen: "notifications" },
      }),
    });

    const result = await response.json();

    if (result.data?.[0]?.status === "error") {
      console.error(`[Push] Failed for ${userId}:`, result.data[0].message);
      return false;
    }

    console.log(`[Push] Sent to ${userId}: ${title}`);
    return true;
  } catch (error) {
    console.error(`[Push] Error for ${userId}:`, error);
    return false;
  }
}

/**
 * Save notification to database (in-app)
 */
export async function saveInAppNotification(userId, { type, title, body }) {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        body,
        read: false,
      })
      .returning();

    return notification;
  } catch (error) {
    console.error(`[Notification] Failed to save for ${userId}:`, error);
    return null;
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId) {
  return await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
}

/**
 * Get all notifications for a user
 */
export async function getAllNotifications(userId, limit = 50) {
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId))
    .returning();
  return updated;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

/**
 * Get the last notification sent to a user
 */
export async function getLastNotification(userId) {
  const [last] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(1);
  return last;
}
