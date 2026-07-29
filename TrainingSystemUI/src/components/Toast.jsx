import { useEffect } from "react";

function Toast({ toast, onDone }) {
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(onDone, 2800);
        return () => clearTimeout(timer);
    }, [toast, onDone]);

    if (!toast) return null;

    const icon = toast.type === "error" ? "✗" : "✓";

    return (
        <div className={`toast toast-${toast.type || "success"}`} role="status">
            <span style={{ fontWeight: 700, marginRight: 8 }}>{icon}</span>
            {toast.message}
        </div>
    );
}

export default Toast;