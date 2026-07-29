import api from "../api/axios";

export const getRoles = async () => {
    return await api.get("/Role");
};

export const createRole = async (data) => {
    return await api.post("/Role", data);
};

export const updateRole = async (id, data) => {
    return await api.put(`/Role/${id}`, data);
};

export const deleteRole = async (id) => {
    return await api.delete(`/Role/${id}`);
};