import api from "../api/axios";

export const getExams = async (page = 1, pageSize = 20, search = "") =>
    await api.get(`/Exam?page=${page}&pageSize=${pageSize}&search=${search}`);

export const getExam = async (id) =>
    await api.get(`/Exam/${id}`);

export const getExamQuestions = async (id) =>
    await api.get(`/Exam/${id}/questions`);

export const createExam = async (data) =>
    await api.post("/Exam", data);

export const updateExam = async (id, data) =>
    await api.put(`/Exam/${id}`, data);

export const deleteExam = async (id) =>
    await api.delete(`/Exam/${id}`);

export const submitExam = async (examId, answers, startedAt) =>
    await api.post(`/Exam/${examId}/submit`, {
        answers,
        startedAt: startedAt || null
    });
