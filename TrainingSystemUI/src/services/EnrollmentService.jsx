import api from "../api/axios";

export const getEnrollments = async (page = 1, pageSize = 20, search = "") =>
    await api.get(`/Enrollment?page=${page}&pageSize=${pageSize}&search=${search}`);

export const getMyEnrollments = async () =>
    await api.get("/Enrollment/my");

export const getEnrollment = async (id) =>
    await api.get(`/Enrollment/${id}`);

export const createEnrollment = async (data) =>
    await api.post("/Enrollment", data);

export const enrollSelf = async (courseID) =>
    await api.post("/Enrollment/enroll", { courseID });

export const updateEnrollment = async (id, data) =>
    await api.put(`/Enrollment/${id}`, data);

export const deleteEnrollment = async (id) =>
    await api.delete(`/Enrollment/${id}`);