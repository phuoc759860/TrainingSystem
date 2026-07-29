import api from "../api/axios";

export const getAvailableCourses = async () =>
    await api.get("/Statistics/courses");

export const getClassOverview = async (courseId = "") =>
    await api.get(`/Statistics/class${courseId ? `?courseId=${courseId}` : ""}`);

export const getStudentDetail = async (userId) =>
    await api.get(`/Statistics/student/${userId}`);

export const getQuestionInsights = async (examId = "", courseId = "") => {
    const params = new URLSearchParams();
    if (examId) params.append("examId", examId);
    if (courseId) params.append("courseId", courseId);
    const qs = params.toString();
    return await api.get(`/Statistics/questions${qs ? `?${qs}` : ""}`);
};

export const getExamRanking = async (courseId = "") =>
    await api.get(`/Statistics/exam-ranking${courseId ? `?courseId=${courseId}` : ""}`);

export const getTrainers = async () =>
    await api.get("/Statistics/trainers");

export const getTrainerDetail = async (userId) =>
    await api.get(`/Statistics/trainer/${userId}`);