import api from "../api/axios";

export const getMyGrades = async () =>
    await api.get("/Grade/my");

export const getCourseGrades = async (courseId) =>
    await api.get(`/Grade/course/${courseId}`);

export const getStudentGrades = async (userId) =>
    await api.get(`/Grade/student/${userId}`);
