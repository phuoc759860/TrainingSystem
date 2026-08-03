import { useEffect, useRef } from "react";

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusables(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(FOCUSABLE))
        .filter(el => !el.hidden && (el.offsetWidth > 0 || el.offsetHeight > 0));
}

// Traps keyboard focus inside a modal while it is active and restores focus to
// the element that opened it when it closes.
//
// The trigger is captured during render, before React commits the dialog into
// the DOM — at that point the opener is still focused even if a field inside
// the dialog has autoFocus. The activeRef guard lets the cleanup distinguish a
// real close from React StrictMode's simulated unmount/remount, so focus is
// only restored once, on the actual close.
export default function useFocusTrap(active, initialFocusRef) {
    const containerRef = useRef(null);
    const restoreRef = useRef(null);
    const activeRef = useRef(active);
    activeRef.current = active;

    if (active && restoreRef.current === null) {
        restoreRef.current = document.activeElement;
    }

    useEffect(() => {
        if (!active) return;

        const container = containerRef.current;
        const focusables = getFocusables(container);
        const current = document.activeElement;
        const alreadyInside = !!container && (current === container || container.contains(current));

        if (!alreadyInside) {
            (initialFocusRef?.current ?? focusables[0] ?? container)?.focus?.();
        }

        const onKeyDown = (e) => {
            if (e.key !== "Tab") return;
            const list = getFocusables(container);
            if (list.length === 0) return;
            const first = list[0];
            const last = list[list.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        container?.addEventListener("keydown", onKeyDown);

        return () => {
            container?.removeEventListener("keydown", onKeyDown);
            if (!activeRef.current) {
                const toRestore = restoreRef.current;
                restoreRef.current = null;
                if (toRestore?.focus) toRestore.focus();
            }
        };
    }, [active, initialFocusRef]);

    return containerRef;
}
