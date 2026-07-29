import api from "../api/axios";

export const getQuestions = async (examId = "", page = 1, pageSize = 20) =>
    await api.get(`/QuestionBank${examId ? `?examId=${examId}&` : "?"}page=${page}&pageSize=${pageSize}`);

export const getQuestion = async (id) =>
    await api.get(`/QuestionBank/${id}`);

export const createQuestion = async (data) =>
    await api.post("/QuestionBank", data);

export const updateQuestion = async (id, data) =>
    await api.put(`/QuestionBank/${id}`, data);

export const deleteQuestion = async (id) =>
    await api.delete(`/QuestionBank/${id}`);