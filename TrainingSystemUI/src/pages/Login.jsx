import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import AuthCard from "../components/AuthCard";
import Toast from "../components/Toast";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [toast, setToast] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const result = await login({ email, password });
            if (!result.token) {
                setToast({ message: "Login failed: No token returned.", type: "error" });
                return;
            }
            localStorage.setItem("token", result.token);
            localStorage.setItem("userID", result.userID);
            localStorage.setItem("name", result.name);
            localStorage.setItem("email", result.email);
            localStorage.setItem("roleID", result.roleID);
            localStorage.setItem("role", result.role);
            navigate("/dashboard");
        } catch (error) {
            setToast({ message: error.response?.data || error.message, type: "error" });
        }
    };

    return (
        <AuthCard
            title="Welcome back"
            subtitle="Sign in to your TrainingHub account"
            altText="Don't have an account?"
            altAction="Create one"
            altLink={() => navigate("/register")}
            toast={toast}
            setToast={setToast}
        >
            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-linear-to-t from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] transition-all"
                >
                    Sign in
                </button>
            </form>

            <Toast toast={toast} onDone={() => setToast(null)} />
        </AuthCard>
    );
}

export default Login;
