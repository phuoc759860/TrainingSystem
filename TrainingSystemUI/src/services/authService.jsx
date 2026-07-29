import api from "../api/axios";

export const login = async (data) => {
    const response = await api.post("/users/login", data);
    return response.data;
};

export const register = async (data) => {
    const response = await api.post("/users", data);
    return response.data;
};

