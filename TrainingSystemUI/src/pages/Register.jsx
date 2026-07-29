import { useEffect, useState } from "react";
import { register } from "../services/authService";
import { getRoles } from "../services/RoleService";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import useToast from "../hooks/useToast";

function Register() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const { showToast, toastEl } = useToast();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        roleID: ""
    });

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            const res = await getRoles();
            setRoles(res.data);
        } catch (err) { console.error(err); }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(form);
            showToast("Registration successful!", "success");
            setTimeout(() => navigate("/login"), 800);
        } catch (err) { console.error(err);
            showToast("Registration failed.", "error");
        }
    };

    return (
        <AuthCard
            title="Create your account"
            subtitle="Join TrainingHub and start learning"
            altText="Already have an account?"
            altAction="Sign in"
            altLink={() => navigate("/login")}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input
                        name="name"
                        placeholder="Your name"
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <input
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select
                        name="roleID"
                        onChange={handleChange}
                        defaultValue=""
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                    >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                            <option key={role.roleID} value={role.roleID}>
                                {role.roleName}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-linear-to-t from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] transition-all"
                >
                    Create account
                </button>
            </form>

            {toastEl}
        </AuthCard>
    );
}

export default Register;
