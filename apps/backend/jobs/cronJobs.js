import cron from 'node-cron';
import { db } from '../config/db.js';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { runNotificationAgent } from '../ai/agents/notificationAgent.js';

//At 8AM IST everyday, this sends out a notification

cron.schedule("30 2 * * *", async () => {
    console.log("[Cron] Starting daily notification run...");
    const startTime = Date.now();
    try {
        const activeUsers = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.onboardingCompleted, true));

        console.log(`[Cron] Processing ${activeUsers.length} users...`);

        let processed = 0;
        let notified = 0;
        let errors = 0;

        for (const user of activeUsers) {
            try {
                const result = await runNotificationAgent(user.id);
                processed++;
                if (result?.shouldNotify) notified++;
            } catch (error) {
                errors++;
                console.error(`[Cron] Error processing user ${user.id}`, error);
            }

            //to avoid rate limits, we will put in a small delay here
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
            `[Cron] Done. Processed: ${processed}, Notified: ${notified}, Errors: ${errors}, Duration: ${duration}s`
        );
    } catch (error) {
        console.error(`[Cron] Fatal error in daily run:`, error);
    }
});


//now there will be a weekly recap on sundays at 10:00 IST

cron.schedule("30 4 * * 0", async () => {
    console.log("[Cron] Starting weekly recap run...");
    //here we will implement the weekly summary agent
    console.log('[Cron] weekly recap run completed');
});

//now we need to check subscription reminders here 
cron.schedule("30 3 * * *", async () => {
    console.log("[Cron] checking subscription reminders....");
    //here we will implement the subscription reminder agent
    console.log('[Cron] subscription reminder run completed');
});

console.log('[Cron] scheduled jobs:');
console.log(' - daily notification run: 8:00AM IST');
console.log(' - weekly recap run: 10:00AM Sunday IST');
console.log(' - subscription reminder run: 9:00AM IST');