import api from "../api/axios";

export const getCourseReviews = (courseId) => api.get(`/Review/course/${courseId}`);
export const getRatingSummary = (courseId) => api.get(`/Review/course/${courseId}/summary`);
export const submitReview = (data) => api.post("/Review", data);
export const updateReview = (id, data) => api.put(`/Review/${id}`, data);
export const deleteReview = (id) => api.delete(`/Review/${id}`);
