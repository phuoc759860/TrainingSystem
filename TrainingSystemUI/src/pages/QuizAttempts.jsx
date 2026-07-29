import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizAttempts, getAttemptDetail, getQuiz } from "../services/QuizService";
import Toast from "../components/Toast";

function QuizAttempts() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { role } = useAuth();
    const isStudent = role === "Student";

    const [quiz, setQuiz] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => { loadData(); }, [quizId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [quizRes, attemptsRes] = await Promise.all([
                getQuiz(quizId),
                getQuizAttempts(quizId)
            ]);
            setQuiz(quizRes.data);
            setAttempts(attemptsRes.data);
        } catch {
            setToast({ message: "Couldn't load data.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const viewAttempt = async (attemptId) => {
        try {
            const res = await getAttemptDetail(attemptId);
            setSelectedAttempt(res.data);
        } catch {
            setToast({ message: "Couldn't load attempt.", type: "error" });
        }
    };

    if (loading) return <div className="page"><div className="loading-row"><span className="spinner" /> Loading...</div></div>;

    if (selectedAttempt) {
        const percent = selectedAttempt.totalPoints > 0 ? Math.round(selectedAttempt.score * 100 / selectedAttempt.totalPoints) : 0;
        return (
            <div className="page">
                <div className="welcome-banner" style={selectedAttempt.passed ? {} : { background: "linear-gradient(135deg, var(--danger-bg), var(--surface))" }}>
                    <h2>Attempt Details</h2>
                    <p>{selectedAttempt.quizTitle} — {selectedAttempt.userName}</p>
                </div>
                <div className="card fade-in" style={{ marginBottom: 24, textAlign: "center", padding: 24 }}>
                    <div style={{ fontSize: 40, fontWeight: 800, fontFamily: "var(--font-display)", color: selectedAttempt.passed ? "var(--success)" : "var(--danger)" }}>
                        {percent}%
                    </div>
                    <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                        {selectedAttempt.score}/{selectedAttempt.totalPoints} — {selectedAttempt.passed ? "Passed" : "Failed"}
                    </p>
                </div>
                {selectedAttempt.answers?.map((ans, idx) => (
                    <div key={ans.quizAnswerID} className="card fade-in" style={{ marginBottom: 12, borderLeft: ans.correct ? "4px solid var(--success)" : "4px solid var(--danger)" }}>
                        <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Q{idx + 1}. {ans.questionText}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {ans.options?.map((opt, oIdx) => (
                                <div key={oIdx} style={{
                                    padding: "6px 12px", borderRadius: 8, fontSize: 13,
                                    background: oIdx === ans.correctIndex ? "var(--success-bg)" : oIdx === ans.selectedIndex && !ans.correct ? "var(--danger-bg)" : "transparent",
                                    fontWeight: oIdx === ans.selectedIndex ? 600 : 400
                                }}>
                                    {oIdx === ans.selectedIndex && "→ "}{opt}
                                    {oIdx === ans.correctIndex && " ✓"}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <button className="btn btn-outline" onClick={() => setSelectedAttempt(null)} style={{ marginTop: 8 }}>← Back to Attempts</button>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="welcome-banner">
                <h2>{quiz?.title || "Quiz"} — Attempts</h2>
                <p>{quiz?.lessonTitle}</p>
            </div>

            {attempts.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No attempts yet.</p>
                </div>
            ) : (
                <div className="card fade-in">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                {!isStudent && <th>Student</th>}
                                <th>Score</th>
                                <th>Result</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.map(a => {
                                const pct = a.totalPoints > 0 ? Math.round(a.score * 100 / a.totalPoints) : 0;
                                return (
                                    <tr key={a.quizAttemptID}>
                                        {!isStudent && <td>{a.userName}</td>}
                                        <td style={{ fontWeight: 600 }}>{a.score}/{a.totalPoints} ({pct}%)</td>
                                        <td>
                                            <span className={`badge ${a.passed ? "" : "badge-video"}`}
                                                style={a.passed ? { background: "var(--success-bg)", color: "var(--success)" } : { background: "var(--danger-bg)", color: "var(--danger)" }}>
                                                {a.passed ? "Passed" : "Failed"}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                                            {new Date(a.completedAt).toLocaleString()}
                                        </td>
                                        <td>
                                            <button className="btn btn-outline btn-sm" onClick={() => viewAttempt(a.quizAttemptID)}>
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>← Back</button>
            <Toast toast={toast} onDone={() => setToast(null)} />
        </div>
    );
}

export default QuizAttempts;
