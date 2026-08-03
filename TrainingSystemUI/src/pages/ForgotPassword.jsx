import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import AuthCard from "../components/AuthCard";
import useToast from "../hooks/useToast";

function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [devLink, setDevLink] = useState("");
    const { showToast, toastEl } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const result = await forgotPassword({ email });
            if (result.devResetLink) {
                setDevLink(result.devResetLink);
            }
            showToast("If an account exists for that email, a reset link has been sent.", "success");
        } catch (error) {
            showToast(error.response?.data?.message || error.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthCard
            title="Reset your password"
            subtitle="Enter your email and we'll send you a reset link"
            altText="Remembered your password?"
            altAction="Sign in"
            altLink={() => navigate("/login")}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-linear-to-t from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                    {submitting ? "Sending..." : "Send reset link"}
                </button>
            </form>

            {devLink && (
                <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                        Development mode — no email server configured. Use this reset link:
                    </p>
                    <a
                        href={devLink}
                        className="text-xs text-brand-600 break-all hover:underline"
                    >
                        {devLink}
                    </a>
                </div>
            )}

            {toastEl}
        </AuthCard>
    );
}

export default ForgotPassword;
