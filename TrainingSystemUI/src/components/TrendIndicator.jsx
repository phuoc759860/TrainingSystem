import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * TrendIndicator — shows an up/down/neutral trend arrow with label.
 *
 * Props:
 *   value      – number (positive = up, negative = down, 0 = flat)
 *   suffix     – label suffix (e.g. "vs last week", "%")
 *   upColor    – color for positive (default var(--color-success, #17a668))
 *   downColor  – color for negative (default var(--color-danger, #e34a4a))
 *   neutralColor – color for zero
 *   className  – extra CSS class
 */
export default function TrendIndicator({
    value,
    suffix = "",
    upColor,
    downColor,
    neutralColor,
    className = "",
}) {
    const isUp = value > 0;
    const isDown = value < 0;
    const absVal = Math.abs(value);

    const color = isUp
        ? upColor || "var(--color-success, #17a668)"
        : isDown
        ? downColor || "var(--color-danger, #e34a4a)"
        : neutralColor || "var(--ink-soft, #64748b)";

    const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    const label = isUp ? `+${absVal}` : isDown ? `-${absVal}` : "0";

    return (
        <span
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "11px",
                fontWeight: 600,
                color,
                lineHeight: 1,
            }}
        >
            <Icon size={12} strokeWidth={2.2} />
            {label}
            {suffix && (
                <span style={{ color: "var(--ink-soft, #64748b)", fontWeight: 500 }}>
                    {suffix}
                </span>
            )}
        </span>
    );
}
