import { useEffect, useRef, useCallback } from "react";

function Toast({ toast, onDone }) {
    const timerRef = useRef(null);
    const remainingRef = useRef(2800);
    const startRef = useRef(null);

    const startTimer = useCallback((ms) => {
        clearTimeout(timerRef.current);
        startRef.current = Date.now();
        timerRef.current = setTimeout(onDone, ms);
    }, [onDone]);

    useEffect(() => {
        if (!toast) return;
        remainingRef.current = 2800;
        startTimer(2800);
        return () => clearTimeout(timerRef.current);
    }, [toast, startTimer]);

    const pause = () => {
        clearTimeout(timerRef.current);
        remainingRef.current -= Date.now() - startRef.current;
    };

    const resume = () => {
        startTimer(Math.max(remainingRef.current, 500));
    };

    if (!toast) return null;

    const icon = toast.type === "error" ? "\u2717" : "\u2713";

    return (
        <div
            className={`toast toast-${toast.type || "success"}`}
            role="status"
            onMouseEnter={pause}
            onMouseLeave={resume}
        >
            <span style={{ fontWeight: 700, marginRight: 8 }}>{icon}</span>
            {toast.message}
        </div>
    );
}

export default Toast;
