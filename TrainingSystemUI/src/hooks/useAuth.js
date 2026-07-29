export default function useAuth() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const userID = localStorage.getItem("userID");
    const roleID = localStorage.getItem("roleID");

    return {
        token,
        role,
        name,
        email,
        userID,
        roleID,
        isAuthenticated: !!token,
        isAdmin: role === "Admin",
        isTrainer: role === "Trainer",
        isStudent: role === "Student",
        logout: () => localStorage.clear()
    };
}
