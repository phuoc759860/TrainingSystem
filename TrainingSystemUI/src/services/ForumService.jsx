import api from "../api/axios";

export const getThreads = (courseId, page = 1, pageSize = 25) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("pageSize", pageSize);
    return api.get(`/Forum/course/${courseId}?${params.toString()}`);
};
export const getThread = (threadId) => api.get(`/Forum/${threadId}`);
export const createThread = (data) => api.post("/Forum", data);
export const createReply = (threadId, content) => api.post(`/Forum/${threadId}/reply`, { content });
