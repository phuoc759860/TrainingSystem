import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { login, resendVerification } from "../services/authService";
import AuthCard from "../components/AuthCard";
import useToast from "../hooks/useToast";
import useFocusTrap from "../hooks/useFocusTrap";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { showToast, toastEl } = useToast();
    const [verifyPanelOpen, setVerifyPanelOpen] = useState(false);
    const [resendMsg, setResendMsg] = useState("");
    const [resending, setResending] = useState(false);

    const verifyTrapRef = useFocusTrap(verifyPanelOpen);

    useEffect(() => {
        if (!verifyPanelOpen) return;
        const onKey = (e) => { if (e.key === "Escape") setVerifyPanelOpen(false); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [verifyPanelOpen]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const result = await login({ email, password });
            if (!result.token) {
                showToast("Login failed: No token returned.", "error");
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
            const status = error.response?.status;
            const msg = error.response?.data?.message || "";
            if (status === 403 && msg.toLowerCase().includes("verify")) {
                setResendMsg("");
                setVerifyPanelOpen(true);
            } else {
                showToast(msg || error.message, "error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await resendVerification({ email });
            setResendMsg("Check your inbox — a new verification link has been sent.");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to resend verification email.", "error");
        } finally {
            setResending(false);
        }
    };

    return (
        <>
        <AuthCard
            title="Welcome back"
            subtitle="Sign in to your TrainingHub account"
            altText="Don't have an account?"
            altAction="Create one"
            altLink={() => navigate("/register")}
        >
            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200/80 text-sm outline-none transition-all"
                        required
                    />
                </div>
                <div className="login-field-wrapper">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="login-password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200/80 text-sm outline-none transition-all pr-11"
                            required
                        />
                        <button
                            type="button"
                            className="login-password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary w-full login-submit-btn"
                    disabled={submitting}
                >
                    {submitting ? (
                        <span className="login-spinner" />
                    ) : (
                        "Sign in"
                    )}
                </button>
                <div className="text-center mt-2">
                    <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                        Forgot password?
                    </button>
                </div>
            </form>

            {toastEl}
        </AuthCard>

        {verifyPanelOpen && (
            <div className="modal-backdrop" ref={verifyTrapRef} onMouseDown={() => setVerifyPanelOpen(false)}>
                <div
                    className="modal-card"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="verify-title"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <h3 id="verify-title" className="modal-title">Email not verified</h3>
                    <p className="modal-message">
                        You can't sign in until you verify your email address. Check your inbox
                        (and spam folder) for the verification link we sent to <strong>{email}</strong>.
                    </p>
                    {resendMsg ? (
                        <p className="text-sm text-green-600 font-medium mt-2">{resendMsg}</p>
                    ) : null}
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setVerifyPanelOpen(false)}>
                            Close
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleResend}
                            disabled={resending}
                        >
                            {resending ? "Sending…" : "Resend verification email"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export default Login;
