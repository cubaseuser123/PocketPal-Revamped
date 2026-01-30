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

export default router;