import api from "../api/axios";

export const getScheduleEntries = (courseId = "") =>
    api.get(`/Schedule?courseId=${courseId}`);

export const getWeeklySchedule = async (courseId) =>
    await api.get(`/Schedule/weekly/${courseId}`);

export const createScheduleEntry = async (data) =>
    await api.post("/Schedule", data);

export const updateScheduleEntry = async (id, data) =>
    await api.put(`/Schedule/${id}`, data);

export const deleteScheduleEntry = async (id) =>
    await api.delete(`/Schedule/${id}`);
