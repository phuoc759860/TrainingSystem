/**
 * EmptyState — reusable empty-state placeholder with Lucide icon.
 *
 * Props:
 *   icon      – Lucide icon component (e.g. BookOpen, AlertCircle)
 *   title     – bold heading text
 *   message   – descriptive text
 *   accent    – icon color override (default "var(--ink-soft, #64748b)")
 *   className – extra CSS class
 */
export default function EmptyState({
    icon: Icon,
    title = "Nothing here yet",
    message = "",
    accent,
    className = "",
}) {
    return (
        <div
            className={className}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "48px 24px",
                textAlign: "center",
            }}
        >
            {Icon && (
                <div
                    style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        background: "var(--surface-soft, #f8fafc)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Icon
                        size={26}
                        strokeWidth={1.7}
                        color={accent || "var(--ink-soft, #64748b)"}
                    />
                </div>
            )}
            {title && (
                <div
                    style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--ink, #0f172a)",
                        lineHeight: 1.3,
                    }}
                >
                    {title}
                </div>
            )}
            {message && (
                <div
                    style={{
                        fontSize: "13px",
                        color: "var(--ink-soft, #64748b)",
                        lineHeight: 1.5,
                        maxWidth: "320px",
                    }}
                >
                    {message}
                </div>
            )}
        </div>
    );
}
