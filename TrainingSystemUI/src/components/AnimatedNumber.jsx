import { useEffect, useRef, useState } from "react";

export default function AnimatedNumber({ value, duration = 700 }) {
    const [display, setDisplay] = useState(0);
    const frameRef = useRef(null);
    const prevValue = useRef(value);

    useEffect(() => {
        if (value == null) return;
        const target = Number(value) || 0;
        const startTime = performance.now();
        const startValue = prevValue.current != null ? Number(prevValue.current) : 0;
        prevValue.current = target;

        const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(startValue + (target - startValue) * eased));
            if (progress < 1) frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [value, duration]);

    if (value == null) return <>&ndash;</>;
    return <>{display}</>;
}
