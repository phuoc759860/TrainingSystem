import { useEffect, useState, useMemo } from "react";
import { getMyGrades } from "../services/GradeService";
import useToast from "../hooks/useToast";

function scoreColor(value) {
    if (value >= 70) return "var(--success)";
    if (value >= 50) return "var(--brand)";
    return "var(--danger)";
}

function scoreCardClass(value) {
    if (value >= 70) return "stat-card-green";
    if (value >= 50) return "stat-card-purple";
    return "stat-card-coral";
}

function scoreGrade(value) {
    if (value >= 90) return "A";
    if (value >= 80) return "B";
    if (value >= 70) return "C";
    if (value >= 60) return "D";
    return "F";
}

function MiniBar({ value, max = 100, delay = 0 }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => setWidth(Math.max(0, Math.min(100, (value / max) * 100))), delay);
        return () => clearTimeout(timer);
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

function Grades() {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast, toastEl } = useToast();

    useEffect(() => {
        loadGrades();
    }, []);

    const loadGrades = async () => {
        setLoading(true);
        try {
            const res = await getMyGrades();
            setGrades(res.data);
        } catch (err) { console.error(err);
            showToast("Couldn't load grades.", "error");
        } finally {
            setLoading(false);
        }
    };

    const overallAvg = useMemo(() => {
        const graded = grades.filter(g => g.finalGrade != null);
        if (graded.length === 0) return null;
        return Math.round(graded.reduce((sum, g) => sum + g.finalGrade, 0) / graded.length * 10) / 10;
    }, [grades]);

    const passedCount = grades.filter(g => g.finalGrade != null && g.finalGrade >= 60).length;

    return (
        <div className="page">
            <div className="welcome-banner">
                <h2>My Grades</h2>
                <p>View your weighted final grades across all enrolled courses (30% Quizzes + 70% Exams)</p>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading grades...
                </div>
            ) : grades.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📋</div>
                    <p>You are not enrolled in any courses yet.</p>
                </div>
            ) : (
                <>
                    <div className="stat-grid" style={{ marginBottom: 24 }}>
                        <div className={`stat-card ${overallAvg != null ? scoreCardClass(overallAvg) : "stat-card-purple"}`}>
                            <div className="num" style={{ color: "#fff" }}>
                                {overallAvg != null ? `${overallAvg}%` : "—"}
                            </div>
                            <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Overall Average</div>
                        </div>
                        <div className="stat-card stat-card-blue">
                            <div className="num" style={{ color: "#fff" }}>{grades.length}</div>
                            <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Enrolled Courses</div>
                        </div>
                        <div className="stat-card stat-card-green">
                            <div className="num" style={{ color: "#fff" }}>{passedCount}</div>
                            <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Passed (≥60%)</div>
                        </div>
                        <div className="stat-card stat-card-yellow">
                            <div className="num" style={{ color: "#fff" }}>{overallAvg != null ? scoreGrade(overallAvg) : "—"}</div>
                            <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Letter Grade</div>
                        </div>
                    </div>

                    <table className="table-modern fade-in">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Quiz Score (30%)</th>
                                <th>Exam Score (70%)</th>
                                <th>Final Grade</th>
                                <th>Letter</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grades.map((g, i) => (
                                <tr key={g.courseID} style={{ animationDelay: `${i * 20}ms` }}>
                                    <td style={{ fontWeight: 600 }}>{g.courseTitle}</td>
                                    <td>
                                        {g.quizScore != null ? (
                                            <>
                                                <MiniBar value={g.quizScore} delay={200 + i * 30} />
                                                <span style={{ color: scoreColor(g.quizScore), fontWeight: 600 }}>
                                                    {g.quizScore}%
                                                </span>
                                                <span style={{ color: "var(--ink-soft)", fontSize: 12, marginLeft: 4 }}>
                                                    ({g.quizAttempted}/{g.quizCount})
                                                </span>
                                            </>
                                        ) : (
                                            <span style={{ color: "var(--ink-soft)" }}>No quizzes yet</span>
                                        )}
                                    </td>
                                    <td>
                                        {g.examScore != null ? (
                                            <>
                                                <MiniBar value={g.examScore} delay={200 + i * 30} />
                                                <span style={{ color: scoreColor(g.examScore), fontWeight: 600 }}>
                                                    {g.examScore}%
                                                </span>
                                                <span style={{ color: "var(--ink-soft)", fontSize: 12, marginLeft: 4 }}>
                                                    ({g.examAttempted}/{g.examCount})
                                                </span>
                                            </>
                                        ) : (
                                            <span style={{ color: "var(--ink-soft)" }}>No exams yet</span>
                                        )}
                                    </td>
                                    <td>
                                        {g.finalGrade != null ? (
                                            <span style={{
                                                fontWeight: 700,
                                                fontSize: 16,
                                                color: scoreColor(g.finalGrade)
                                            }}>
                                                {g.finalGrade}%
                                            </span>
                                        ) : (
                                            <span style={{ color: "var(--ink-soft)" }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        {g.finalGrade != null ? (
                                            <span
                                                className="badge"
                                                style={{
                                                    background: scoreColor(g.finalGrade),
                                                    color: "#fff",
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    padding: "4px 12px"
                                                }}
                                            >
                                                {scoreGrade(g.finalGrade)}
                                            </span>
                                        ) : "—"}
                                    </td>
                                    <td>
                                        <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>
                                            {g.quizAttempted}/{g.quizCount} quizzes · {g.examAttempted}/{g.examCount} exams
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {toastEl}
        </div>
    );
}

export default Grades;
