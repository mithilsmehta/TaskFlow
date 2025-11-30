import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

export const notificationApi = {
  // Get all notifications
  getNotifications: async (params = {}) => {
    const { limit = 20, skip = 0, unreadOnly = false } = params;
    const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET_ALL, {
      params: { limit, skip, unreadOnly },
    });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.UNREAD_COUNT);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_READ(notificationId));
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_ALL_READ);
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await axiosInstance.delete(API_PATHS.NOTIFICATIONS.DELETE(notificationId));
    return response.data;
  },
};
