import api from "../api/axios";

export const getUsers = async (page = 1, pageSize = 20, search = "", roleID = "") => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("pageSize", pageSize);
    if (search.trim()) params.append("search", search.trim());
    if (roleID) params.append("roleID", roleID);
    return await api.get(`/users?${params.toString()}`);
};

export const createUser = async (data) => {
    return await api.post("/users", data);
};

export const getUser = async (id) => {
    return await api.get(`/users/${id}`);
};

export const updateUser = async (id, data) =>
    await api.put(`/users/${id}`, data);

export const deleteUser = async (id) =>
    await api.delete(`/users/${id}`);

export const getRecipients = async () => {
    return await api.get("/users/recipients");
};

export const getTrainers = async () => {
    return await api.get("/users/trainers");
};