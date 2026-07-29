import { useEffect, useRef } from "react";

// A small, dependency-free confirm modal used in place of window.confirm().
// Usage:
//   const [confirmState, setConfirmState] = useState(null);
//   setConfirmState({
//       title: "Delete exam?",
//       message: "This can't be undone.",
//       confirmLabel: "Delete",
//       danger: true,
//       onConfirm: async () => { await deleteExam(id); loadExams(); }
//   });
//   <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
function ConfirmDialog({ state, onClose }) {
    const confirmBtnRef = useRef(null);

    useEffect(() => {
        if (state) {
            confirmBtnRef.current?.focus();
        }
    }, [state]);

    useEffect(() => {
        if (!state) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [state, onClose]);

    if (!state) return null;

    const handleConfirm = async () => {
        await state.onConfirm();
        onClose();
    };

    return (
        <div className="modal-backdrop" onMouseDown={onClose}>
            <div
                className="modal-card"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <h3 id="confirm-title" className="modal-title">{state.title}</h3>
                {state.message && <p className="modal-message">{state.message}</p>}

                <div className="modal-actions">
                    <button className="btn btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        ref={confirmBtnRef}
                        className={`btn ${state.danger ? "btn-danger-solid" : "btn-primary"}`}
                        onClick={handleConfirm}
                    >
                        {state.confirmLabel || "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;