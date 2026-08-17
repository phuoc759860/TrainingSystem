import { useEffect, useState } from "react";

export default function MiniBar({ value = 0, max = 100, delay = 0 }) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const clamped = Math.max(0, Math.min(100, (value / max) * 100));
        const t = setTimeout(() => setWidth(clamped), delay);
        return () => clearTimeout(t);
    }, [value, max, delay]);

    const fillClass = value >= 70 ? "fill-success" : value >= 50 ? "fill-brand" : "fill-danger";

    return (
        <span className="mini-bar">
            <span
                className={`mini-bar-fill ${fillClass}`}
                style={{ width: `${width}%` }}
            />
        </span>
    );
}
