/**
 * Returns a time-of-day greeting string.
 * @param {string} [name] – optional user's display name
 * @returns {string}
 */
export function getGreeting(name) {
    const hour = new Date().getHours();
    let greet = "Good evening";
    if (hour >= 5 && hour < 12) greet = "Good morning";
    else if (hour >= 12 && hour < 18) greet = "Good afternoon";
    return name ? `${greet}, ${name}` : greet;
}

/**
 * Format a date/time for display.
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
