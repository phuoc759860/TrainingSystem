import api from "../api/axios";

export const getQuizzes = async (lessonId = "", courseId = "") =>
    await api.get(`/Quiz?lessonId=${lessonId}&courseId=${courseId}`);

export const getQuiz = async (id) =>
    await api.get(`/Quiz/${id}`);

export const getQuizForTaking = async (id) =>
    await api.get(`/Quiz/${id}/take`);

export const createQuiz = async (data) =>
    await api.post("/Quiz", data);

export const updateQuiz = async (id, data) =>
    await api.put(`/Quiz/${id}`, data);

export const deleteQuiz = async (id) =>
    await api.delete(`/Quiz/${id}`);

export const addQuestion = async (quizId, data) =>
    await api.post(`/Quiz/${quizId}/questions`, data);

export const deleteQuestion = async (questionId) =>
    await api.delete(`/Quiz/questions/${questionId}`);

export const submitQuiz = async (quizId, data) =>
    await api.post(`/Quiz/${quizId}/submit`, data);

export const getQuizAttempts = async (quizId) =>
    await api.get(`/Quiz/${quizId}/attempts`);

export const getAttemptDetail = async (attemptId) =>
    await api.get(`/Quiz/attempts/${attemptId}`);
