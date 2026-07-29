import { useState, useCallback } from "react";
import Toast from "../components/Toast";

export default function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
    }, []);

    const toastEl = toast ? (
        <Toast toast={toast} onDone={() => setToast(null)} />
    ) : null;

    return { toast, setToast, showToast, toastEl };
}
