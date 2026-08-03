import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import AuthCard from "../components/AuthCard";

function VerifyEmail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [status, setStatus] = useState("verifying");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }
        verifyEmail({ token })
            .then(() => setStatus("success"))
            .catch(() => setStatus("error"));
    }, [token]);

    return (
        <AuthCard
            title="Email verification"
            subtitle="Confirming your email address"
            altText=""
            altAction=""
            altLink={() => navigate("/login")}
        >
            <div className="text-center py-6">
                {status === "verifying" && (
                    <p className="text-sm text-gray-500">Verifying your email, please wait...</p>
                )}
                {status === "success" && (
                    <>
                        <p className="text-sm text-gray-700 mb-1">Your email has been verified.</p>
                        <p className="text-sm text-gray-500">You can now sign in to TrainingHub.</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="mt-4 px-4 py-2 rounded-xl bg-linear-to-t from-brand-600 to-brand-500 text-white text-sm font-semibold"
                        >
                            Go to sign in
                        </button>
                    </>
                )}
                {status === "error" && (
                    <>
                        <p className="text-sm text-gray-700 mb-1">This verification link is invalid or has expired.</p>
                        <p className="text-sm text-gray-500">Please request a new one.</p>
                    </>
                )}
            </div>
        </AuthCard>
    );
}

export default VerifyEmail;
