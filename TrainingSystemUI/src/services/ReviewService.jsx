import api from "../api/axios";

export const getCourseReviews = (courseId, page = 1, pageSize = 25) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("pageSize", pageSize);
    return api.get(`/Review/course/${courseId}?${params.toString()}`);
};
export const getRatingSummary = (courseId) => api.get(`/Review/course/${courseId}/summary`);
export const submitReview = (data) => api.post("/Review", data);
export const updateReview = (id, data) => api.put(`/Review/${id}`, data);
export const deleteReview = (id) => api.delete(`/Review/${id}`);
