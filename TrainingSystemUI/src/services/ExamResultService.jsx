import api from "../api/axios";

export const getExamResults = async (page = 1, pageSize = 20, search = "", grading = "") =>
    await api.get(`/ExamResult?page=${page}&pageSize=${pageSize}&search=${search}&grading=${grading}`);

export const getExamResult = async (id) =>
    await api.get(`/ExamResult/${id}`);

export const getExamAttempt = async (id) =>
    await api.get(`/ExamResult/${id}/attempt`);

export const gradeExamAttempt = async (id, data) =>
    await api.put(`/ExamResult/${id}/grade`, data);

export const createExamResult = async (data) =>
    await api.post("/ExamResult", data);

export const updateExamResult = async (id, data) =>
    await api.put(`/ExamResult/${id}`, data);

export const deleteExamResult = async (id) =>
    await api.delete(`/ExamResult/${id}`);