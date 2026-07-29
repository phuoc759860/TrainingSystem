import api from "../api/axios";

export const getDashboard = async () =>
    await api.get("/Dashboard");

export const getAdminDashboard = async () =>
    await api.get("/Dashboard/admin");

export const getTrainerDashboard = async () =>
    await api.get("/Dashboard/trainer");

export const getStudentDashboard = async () =>
    await api.get("/Dashboard/student");