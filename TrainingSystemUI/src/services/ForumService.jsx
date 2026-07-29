import api from "../api/axios";

export const getThreads = (courseId) => api.get(`/Forum/course/${courseId}`);
export const getThread = (threadId) => api.get(`/Forum/${threadId}`);
export const createThread = (data) => api.post("/Forum", data);
export const createReply = (threadId, content) => api.post(`/Forum/${threadId}/reply`, { content });
