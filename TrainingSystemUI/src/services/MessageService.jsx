import api from "../api/axios";

export const getInbox = () => api.get("/Message/inbox");
export const getSentMessages = () => api.get("/Message/sent");
export const getUnreadCount = () => api.get("/Message/unread-count");
export const sendMessage = (data) => api.post("/Message", data);
export const markMessageRead = (id) => api.put(`/Message/${id}/read`);
export const deleteMessage = (id) => api.delete(`/Message/${id}`);
