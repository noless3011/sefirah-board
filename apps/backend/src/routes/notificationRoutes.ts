import { Router } from "express";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notificationController.js";

const router = Router();

// Domain: Notifications ( /api/v1/notifications )
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:notificationId", markAsRead);
router.post("/mark-all-read", markAllAsRead);
router.delete("/:notificationId", deleteNotification);

export default router;
