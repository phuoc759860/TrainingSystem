import api from "../api/axios";

export const getLessons = (search = "", courseId = "", page = 1, pageSize = 20) =>
    api.get(`/Lesson?search=${search}&courseId=${courseId}&page=${page}&pageSize=${pageSize}`);

export const getLesson = async (id) =>
    await api.get(`/Lesson/${id}`);

export const createLesson = async (data) =>
    await api.post("/Lesson", data);

export const updateLesson = async (id, data) =>
    await api.put(`/Lesson/${id}`, data);

export const deleteLesson = async (id) =>
    await api.delete(`/Lesson/${id}`);

export const getLessonVersions = async (id) =>
    await api.get(`/Lesson/${id}/versions`);
