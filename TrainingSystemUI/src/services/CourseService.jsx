import api from "../api/axios";

export const getCourses = (search = "", page = 1, pageSize = 20) =>
    api.get(`/Course?search=${search}&page=${page}&pageSize=${pageSize}`);

export const getCourse = async (id) =>
    await api.get(`/Course/${id}`);

export const createCourse = async (data) =>
    await api.post("/Course", data);

export const updateCourse = async (id, data) =>
    await api.put(`/Course/${id}`, data);

export const deleteCourse = async (id) =>
    await api.delete(`/Course/${id}`);