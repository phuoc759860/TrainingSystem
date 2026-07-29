import api from "../api/axios";

export const getNotifications = () => api.get("/Notification");
export const getUnreadNotificationCount = () => api.get("/Notification/unread-count");
export const markNotificationRead = (id) => api.put(`/Notification/${id}/read`);
export const markAllNotificationsRead = () => api.put("/Notification/read-all");
