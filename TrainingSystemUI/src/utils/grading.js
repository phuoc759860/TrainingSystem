export function scoreColor(value) {
    if (value >= 70) return "var(--success)";
    if (value >= 50) return "var(--brand)";
    return "var(--danger)";
}

export function scoreCardClass(value) {
    if (value >= 70) return "stat-card-green";
    if (value >= 50) return "stat-card-purple";
    return "stat-card-coral";
}

export function scoreGrade(value) {
    if (value >= 90) return "A";
    if (value >= 80) return "B";
    if (value >= 70) return "C";
    if (value >= 60) return "D";
    return "F";
}
