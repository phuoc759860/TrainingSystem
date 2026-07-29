import api from "../api/axios";

export const getProgress = (courseId = "") =>
    api.get(`/LessonProgress?courseId=${courseId}`);

export const getCourseProgress = async (courseId) =>
    await api.get(`/LessonProgress/course/${courseId}`);

export const getResumePoint = async (courseId) =>
    await api.get(`/LessonProgress/resume/${courseId}`);

export const startTracking = async (data) =>
    await api.post("/LessonProgress", data);

export const updateProgress = async (id, data) =>
    await api.put(`/LessonProgress/${id}`, data);

export const deleteProgress = async (id) =>
    await api.delete(`/LessonProgress/${id}`);

export const markViewed = async (materialId, page = null) =>
    await api.post("/LessonProgress/viewed", { materialID: materialId, page: page });

export const getViewedMaterials = async (lessonId) =>
    await api.get(`/LessonProgress/viewed/${lessonId}`);
