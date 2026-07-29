import api from "../api/axios";

export const getPoints = () => api.get("/Gamification/points");
export const getBadges = () => api.get("/Gamification/badges");
export const getLeaderboard = () => api.get("/Gamification/leaderboard");
export const seedBadges = () => api.get("/Gamification/seed-badges");
