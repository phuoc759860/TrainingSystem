import api from "../api/axios";

export const getMaterials = async (page = 1, pageSize = 20) =>
    await api.get(`/Material?page=${page}&pageSize=${pageSize}`);

export const getMaterialsByLesson = async (lessonId) =>
    await api.get(`/Material/bylesson/${lessonId}`);

export const getMaterial = async (id) =>
    await api.get(`/Material/${id}`);

export const createMaterial = async (data) =>
    await api.post("/Material", data);

export const updateMaterial = async (id, data) =>
    await api.put(`/Material/${id}`, data);

export const deleteMaterial = async (id) =>
    await api.delete(`/Material/${id}`);

export const getMaterialVersions = async (id) =>
    await api.get(`/Material/${id}/versions`);
