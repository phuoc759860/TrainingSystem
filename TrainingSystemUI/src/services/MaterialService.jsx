import api from "../api/axios";

export const getMaterials = async (page = 1, pageSize = 20) =>
    await api.get(`/Material?page=${page}&pageSize=${pageSize}`);

export const getMaterialsByLesson = async (lessonId) =>
    await api.get(`/Material/bylesson/${lessonId}`);

export const getMaterial = async (id) =>
    await api.get(`/Material/${id}`);

export const createMaterial = async (data, onProgress) =>
    await api.post("/Material", data, {
        onUploadProgress: onProgress ? (e) => onProgress((e.loaded / e.total) * 100) : undefined
    });

export const updateMaterial = async (id, data, onProgress) =>
    await api.put(`/Material/${id}`, data, {
        onUploadProgress: onProgress ? (e) => onProgress((e.loaded / e.total) * 100) : undefined
    });

export const deleteMaterial = async (id) =>
    await api.delete(`/Material/${id}`);

export const getMaterialVersions = async (id) =>
    await api.get(`/Material/${id}/versions`);

export const getStorageUsage = async () =>
    await api.get(`/Material/storage-usage`);
