import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getUnreadNotifications,
    getAllNotifications,
    markAsRead,
    markAllAsRead
} from '../services/notificationService.js';

const router = express.Router();

router.get("/", protect, async (req, res) => {
    try {
        const notifications = await getAllNotifications(req.user.id);
        const unreadCount = notifications.filter((n) => !n.read).length;

        res.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

router.get('/unread', protect, async (req, res) => {
    try {
        const notifications = await getUnreadNotifications(req.user.id);
        res.json({ notifications, count: notifications.length });
    } catch (error) {
        console.error("Error fetching unread notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

router.post('/:id/read', protect, async (req, res) => {
    try {
        const notification = await markAsRead(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ success: true, notification });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: 'Failed to mark notification as read' })
    }
});

router.post('/read-all', protect, async (req, res) => {
    try {
        await markAllAsRead(req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ message: 'Failed to mark all as read' })
    }
});

// ============ DEV-ONLY TEST ENDPOINTS ============
// These endpoints are for testing notifications during development

import { saveInAppNotification, sendPushNotification } from '../services/notificationService.js';
import { runNotificationAgent } from '../ai/agents/notificationAgent.js';

/**
 * POST /api/v1/notifications/test
 * Send a test in-app notification (DEV ONLY)
 */
router.post('/test', protect, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Not available in production' });
    }
    
    try {
        const { title, body, type } = req.body;
        const notification = await saveInAppNotification(req.user.id, {
            type: type || 'insight',
            title: title || '🧪 Test Notification',
            body: body || 'This is a test notification sent from dev tools!'
        });
        
        res.json({ 
            success: true, 
            message: 'Test notification saved',
            notification 
        });
    } catch (error) {
        console.error("Error sending test notification:", error);
        res.status(500).json({ message: 'Failed to send test notification' });
    }
});

/**
 * POST /api/v1/notifications/test-push
 * Send a test push notification (DEV ONLY)
 */
router.post('/test-push', protect, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Not available in production' });
    }
    
    try {
        const { title, body } = req.body;
        const pushSent = await sendPushNotification(
            req.user.id,
            title || '🔔 Test Push',
            body || 'This is a test push notification!'
        );
        
        // Also save as in-app
        await saveInAppNotification(req.user.id, {
            type: 'alert',
            title: title || '🔔 Test Push',
            body: body || 'This is a test push notification!'
        });
        
        res.json({ 
            success: true, 
            pushSent,
            message: pushSent ? 'Push notification sent!' : 'Push failed (no token?), saved as in-app'
        });
    } catch (error) {
        console.error("Error sending test push:", error);
        res.status(500).json({ message: 'Failed to send test push' });
    }
});

/**
 * POST /api/v1/notifications/trigger-agent
 * Trigger the AI notification agent (DEV ONLY)
 */
router.post('/trigger-agent', protect, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Not available in production' });
    }
    
    try {
        const result = await runNotificationAgent(req.user.id);
        res.json({ 
            success: true, 
            result,
            message: result ? `Agent sent: ${result.title}` : 'Agent decided no notification needed'
        });
    } catch (error) {
        console.error("Error triggering agent:", error);
        res.status(500).json({ message: 'Failed to trigger agent', error: error.message });
    }
});

export default router;