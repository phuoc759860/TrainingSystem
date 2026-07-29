import { useEffect } from "react";

// A reusable slide-in panel for add/edit forms.
// Usage:
//   <SidePanel
//       open={panelOpen}
//       title={editingId == null ? "Add Exam" : "Edit Exam"}
//       onClose={closePanel}
//       footer={<>
//           <button className="btn btn-outline" onClick={closePanel}>Cancel</button>
//           <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
//       </>}
//   >
//       ...form fields...
//   </SidePanel>
//
//   wide={true} — makes the panel wider (720px) for detailed content like reports
function SidePanel({ open, title, subtitle, onClose, children, footer, wide }) {

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="panel-backdrop" onMouseDown={onClose}>
            <div
                className={`panel ${wide ? "panel--wide" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="panel-title"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="panel-header">
                    <div>
                        <h3 id="panel-title" className="panel-title">{title}</h3>
                        {subtitle && <p className="panel-subtitle">{subtitle}</p>}
                    </div>
                    <button className="panel-close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="panel-body">
                    {children}
                </div>

                {footer && (
                    <div className="panel-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SidePanel;