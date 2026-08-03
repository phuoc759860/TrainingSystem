import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import AuthCard from "../components/AuthCard";
import useToast from "../hooks/useToast";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { showToast, toastEl } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            showToast("Passwords do not match.", "error");
            return;
        }
        if (!token) {
            showToast("Missing reset token.", "error");
            return;
        }
        setSubmitting(true);
        try {
            await resetPassword({ token, newPassword: password });
            showToast("Password reset successfully. You can now sign in.", "success");
            setTimeout(() => navigate("/login"), 1200);
        } catch (error) {
            showToast(error.response?.data?.message || error.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthCard
            title="Choose a new password"
            subtitle="Must be at least 8 characters with upper, lower, digit and special character"
            altText="Changed your mind?"
            altAction="Sign in"
            altLink={() => navigate("/login")}
        >
            {!token ? (
                <p className="text-sm text-gray-500">
                    Invalid or missing reset token. Please request a new password reset link.
                </p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 px-4 rounded-xl bg-linear-to-t from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                        {submitting ? "Resetting..." : "Reset password"}
                    </button>
                </form>
            )}

            {toastEl}
        </AuthCard>
    );
}

export default ResetPassword;
