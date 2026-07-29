import api from "../api/axios";

export const getExamAttempt = async (id) =>
    await api.get(`/ExamResult/${id}/attempt`);

export const gradeExamAttempt = async (id, data) =>
    await api.put(`/ExamResult/${id}/grade`, data);