import api from "../api/axios";

export const login = async (data) => {
    const response = await api.post("/users/login", data);
    return response.data;
};

export const register = async (data) => {
    const response = await api.post("/users", data);
    return response.data;
};

export const forgotPassword = async (data) => {
    const response = await api.post("/users/forgot-password", data);
    return response.data;
};

export const resetPassword = async (data) => {
    const response = await api.post("/users/reset-password", data);
    return response.data;
};

export const verifyEmail = async (data) => {
    const response = await api.post("/users/verify-email", data);
    return response.data;
};

export const resendVerification = async (data) => {
    const response = await api.post("/users/resend-verification", data);
    return response.data;
};

