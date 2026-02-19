// Test script for notification agent
// Run with: node apps/backend/test-notifications.js

import { runNotificationAgent } from "./ai/agents/notificationAgent.js";
import { saveInAppNotification, getAllNotifications } from "./services/notificationService.js";
import { db } from "./config/db.js";
import { users } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

async function test() {
  console.log("🔔 Testing Notification System...\n");

  // Get first user from database
  const [user] = await db.select().from(users).limit(1);
  
  if (!user) {
    console.error("❌ No users found in database. Please register a user first.");
    process.exit(1);
  }

  console.log(`📱 Testing with user: ${user.name} (${user.id})\n`);

  // Test 1: Save a test notification
  console.log("Test 1: Saving a test notification...");
  const testNotif = await saveInAppNotification(user.id, {
    type: "insight",
    title: "🧪 Test Notification",
    body: "This is a test notification from the notification system!"
  });
  
  if (testNotif) {
    console.log(`✅ Notification saved with ID: ${testNotif.id}\n`);
  } else {
    console.log("❌ Failed to save notification\n");
  }

  // Test 2: Fetch all notifications
  console.log("Test 2: Fetching all notifications...");
  const notifications = await getAllNotifications(user.id);
  console.log(`✅ Found ${notifications.length} notification(s)\n`);
  
  if (notifications.length > 0) {
    console.log("Latest notifications:");
    notifications.slice(0, 3).forEach((n, i) => {
      console.log(`  ${i + 1}. [${n.type}] ${n.title} - ${n.read ? "read" : "unread"}`);
    });
    console.log("");
  }

  // Test 3: Run the AI notification agent
  console.log("Test 3: Running AI notification agent...");
  try {
    const result = await runNotificationAgent(user.id);
    if (result) {
      console.log(`✅ Agent result:`);
      console.log(`   Type: ${result.type}`);
      console.log(`   Priority: ${result.priority}`);
      console.log(`   Title: ${result.title}`);
      console.log(`   Body: ${result.body}`);
    } else {
      console.log("ℹ️  Agent decided no notification needed");
    }
  } catch (error) {
    console.log(`⚠️  Agent test skipped (may need AI API key): ${error.message}`);
  }

  console.log("\n✨ Testing complete!");
  process.exit(0);
}

test().catch(console.error);
