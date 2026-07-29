import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5149/api";
export const FILE_HOST = API_BASE.replace(/\/api\/?$/, "");

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;