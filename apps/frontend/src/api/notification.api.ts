import axiosClient from "./axiosClient";
import type {
  Notification,
  GetNotificationsResponse,
  MarkAllNotificationsReadResponse
} from "@sefirah/shared";

const NOTIFICATIONS_URL = "/notifications";

export const notificationApi = {
  /** GET /notifications — List notifications */
  getNotifications: (params?: { isRead?: boolean; page?: number; limit?: number }) => {
    return axiosClient.get<GetNotificationsResponse>(NOTIFICATIONS_URL, { params })
      .then((r) => r.data);
  },

  /** GET /notifications/unread-count — Get unread count */
  getUnreadCount: () => {
    return axiosClient.get<{ unreadCount: number }>(`${NOTIFICATIONS_URL}/unread-count`)
      .then((r) => r.data);
  },

  /** PATCH /notifications/:notificationId — Mark a notification as read/unread */
  markAsRead: (notificationId: string, isRead: boolean) => {
    return axiosClient.patch<Notification>(`${NOTIFICATIONS_URL}/${notificationId}`, { isRead })
      .then((r) => r.data);
  },

  /** POST /notifications/mark-all-read — Mark all notifications as read */
  markAllAsRead: () => {
    return axiosClient.post<MarkAllNotificationsReadResponse>(`${NOTIFICATIONS_URL}/mark-all-read`)
      .then((r) => r.data);
  },

  /** DELETE /notifications/:notificationId — Delete a single notification */
  deleteNotification: (notificationId: string) => {
    return axiosClient.delete(`${NOTIFICATIONS_URL}/${notificationId}`)
      .then((r) => r.data);
  },
};
