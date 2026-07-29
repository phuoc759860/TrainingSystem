import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExamQuestions, submitExam } from "../services/ExamService";
import useToast from "../hooks/useToast";
import ConfirmDialog from "../components/ConfirmDialog";

function TakeExam() {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [examMeta, setExamMeta] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { showToast, toastEl } = useToast();

    // Timer
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);
    const startedAtRef = useRef(null);

    // Anti-cheat
    const [tabSwitches, setTabSwitches] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const warningTimerRef = useRef(null);

    // Track if submit is in progress to prevent double-submit
    const submitLockRef = useRef(false);

    useEffect(() => {
        loadExam();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [examId]);

    // Tab-switch detection
    const handleVisibility = useCallback(() => {
        if (document.hidden && !submitLockRef.current) {
            setTabSwitches(prev => {
                const next = prev + 1;
                setShowWarning(true);
                if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
                warningTimerRef.current = setTimeout(() => setShowWarning(false), 4000);
                return next;
            });
        }
    }, []);

    useEffect(() => {
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [handleVisibility]);

    const loadExam = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getExamQuestions(examId);
            const data = res.data;

            setExamMeta(data);
            setQuestions(data.questions);

            // Record start time
            startedAtRef.current = new Date().toISOString();

            // Start timer if time limit exists
            if (data.timeLimitMinutes > 0) {
                const totalSeconds = data.timeLimitMinutes * 60;
                setTimeLeft(totalSeconds);
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message
                || "Unable to load this exam. You may not be enrolled or have no attempts left.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Timer countdown
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || result) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [timeLeft !== null && !result]);

    const handleAnswerChange = (questionID, value) => {
        setAnswers(prev => ({ ...prev, [questionID]: value }));
    };

    const [confirmState, setConfirmState] = useState(null);

    const handleSubmit = async (autoSubmit = false) => {
        if (submitLockRef.current) return;

        if (!autoSubmit) {
            const unanswered = questions.filter(q => !answers[q.questionID]?.trim());
            if (unanswered.length > 0) {
                setConfirmState({
                    title: "Unanswered questions",
                    message: `You have ${unanswered.length} unanswered question(s). Submit anyway?`,
                    confirmLabel: "Submit",
                    danger: true,
                    onConfirm: async () => {
                        submitLockRef.current = true;
                        await doSubmit();
                    }
                });
                return;
            }
        }

        submitLockRef.current = true;
        await doSubmit();
    };

    const doSubmit = async () => {

        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            const payload = questions.map(q => ({
                questionID: q.questionID,
                answer: answers[q.questionID] || ""
            }));

            const res = await submitExam(examId, payload, startedAtRef.current);
            setResult(res.data);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed to submit exam.";
            showToast(msg, "error");
            submitLockRef.current = false;
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const answeredCount = Object.keys(answers).length;

    // Loading
    if (loading) {
        return (
            <div className="page">
                <div className="loading-row">
                    <span className="spinner" /> Loading exam...
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="page">
                <div className="welcome-banner">
                    <h2>Exam Unavailable</h2>
                    <p>{error}</p>
                </div>
                <div className="card empty-state">
                    <div className="empty-icon">&#9888;&#65039;</div>
                    <p style={{ color: "var(--danger)" }}>{error}</p>
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Results view
    if (result) {
        return (
            <div className="page">
                <div className="welcome-banner">
                    <h2>Exam Complete!</h2>
                    <p>Here are your results for {examMeta?.title}</p>
                </div>

                <div className="stat-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card stat-card-purple">
                        <div className="num" style={{ color: "#fff" }}>{result.score}%</div>
                        <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Score</div>
                    </div>
                    <div className="stat-card stat-card-blue">
                        <div className="num" style={{ color: "#fff" }}>{result.correctCount}/{result.totalQuestions}</div>
                        <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Correct</div>
                    </div>
                    <div className={`stat-card ${result.passed ? "stat-card-green" : "stat-card-coral"}`}>
                        <span className="badge" style={{ fontSize: 16, background: "rgba(255,255,255,.2)", color: "#fff" }}>
                            {result.passed ? "\u2713 Passed" : "\u2717 Failed"}
                        </span>
                        <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Status</div>
                    </div>
                    {tabSwitches > 0 && (
                        <div className="stat-card stat-card-yellow">
                            <div className="num" style={{ color: "#fff" }}>{tabSwitches}</div>
                            <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Tab Switches</div>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Question Breakdown</h3>
                    {result.questions.map((q, i) => (
                        <div key={q.questionID} style={{
                            padding: "16px 0",
                            borderBottom: i < result.questions.length - 1 ? "1px solid var(--border)" : "none"
                        }}>
                            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
                                {i + 1}. {q.content}
                            </p>
                            <p style={{ margin: "4px 0", fontSize: 14, color: "var(--ink-soft)" }}>
                                Your answer: <strong style={{ color: "var(--ink)" }}>{q.selectedAnswer || "(no answer)"}</strong>
                            </p>
                            {q.isCorrect !== null ? (
                                <>
                                    <p style={{ margin: "4px 0", fontSize: 14, color: "var(--ink-soft)" }}>
                                        Correct answer: <strong style={{ color: "var(--ink)" }}>{q.correctAnswer}</strong>
                                    </p>
                                    <span className={`badge ${q.isCorrect ? "badge-success" : "badge-danger"}`}>
                                        {q.isCorrect ? `+${q.pointsEarned} pts` : "Incorrect"}
                                    </span>
                                </>
                            ) : (
                                <span className="badge" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>Pending review</span>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 16 }}>
                    <button className="btn btn-outline" onClick={() => navigate(-1)}>
                        Back to Exams
                    </button>
                </div>
            </div>
        );
    }

    // Take exam view
    const timerUrgent = timeLeft !== null && timeLeft <= 60;
    const maxAttempts = examMeta?.maxAttempts || 0;
    const attemptCount = examMeta?.attemptCount || 0;

    return (
        <div className="page">
            {/* Tab-switch warning overlay */}
            {showWarning && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
                    background: "linear-gradient(135deg, #dc2626, #ef4444)",
                    color: "#fff", padding: "12px 24px", textAlign: "center",
                    fontWeight: 700, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,.3)",
                    animation: "fadeIn .2s ease"
                }}>
                    Tab switch detected ({tabSwitches} time{tabSwitches !== 1 ? "s" : ""}). This activity is being logged.
                </div>
            )}

            <div className="welcome-banner">
                <h2>{examMeta?.title}</h2>
                <p>
                    {examMeta?.courseTitle} — {questions.length} questions
                    {maxAttempts > 0 && (
                        <> &middot; Attempt {attemptCount + 1} of {maxAttempts}</>
                    )}
                    {tabSwitches > 0 && (
                        <span style={{ color: "var(--danger)", fontWeight: 600 }}> &middot; {tabSwitches} tab switch{tabSwitches !== 1 ? "es" : ""}</span>
                    )}
                </p>
            </div>

            {/* Status bar */}
            <div className="card fade-in" style={{
                marginBottom: 24, display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "14px 20px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {timeLeft !== null && (
                        <div style={{
                            fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)",
                            color: timerUrgent ? "var(--danger)" : "var(--ink)",
                            background: timerUrgent ? "var(--danger-bg)" : "var(--surface-sunken)",
                            padding: "4px 12px", borderRadius: 8,
                            transition: "all .3s"
                        }}>
                            &#9201; {formatTime(timeLeft)}
                        </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
                        {answeredCount}/{questions.length} answered
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Exam"}
                </button>
            </div>

            {questions.length === 0 && (
                <div className="card">
                    <p>This exam doesn't have any questions yet.</p>
                </div>
            )}

            {questions.map((q, i) => (
                <div key={q.questionID} className="card" style={{ marginBottom: 16 }}>
                    <p style={{ fontWeight: 600, marginBottom: 12 }}>
                        {i + 1}. {q.content}{" "}
                        <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>
                            ({q.score} pts)
                        </span>
                    </p>

                    {q.questionType === "MultipleChoice" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {["A", "B", "C", "D"].map(letter => {
                                const optionKey = `option${letter}`;
                                const optionText = q[optionKey];
                                if (!optionText) return null;

                                return (
                                    <label
                                        key={letter}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                                            border: `1px solid ${answers[q.questionID] === letter ? "var(--brand)" : "var(--border)"}`,
                                            background: answers[q.questionID] === letter ? "var(--brand-bg)" : "transparent",
                                            transition: "all .15s"
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${q.questionID}`}
                                            value={letter}
                                            checked={answers[q.questionID] === letter}
                                            onChange={() => handleAnswerChange(q.questionID, letter)}
                                            style={{ accentColor: "var(--brand)" }}
                                        />
                                        <span>{letter}. {optionText}</span>
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <textarea
                            rows="4"
                            placeholder="Type your answer..."
                            value={answers[q.questionID] || ""}
                            onChange={(e) => handleAnswerChange(q.questionID, e.target.value)}
                        />
                    )}
                </div>
            ))}

            {questions.length > 0 && (
                <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Exam"}
                </button>
            )}

            {toastEl}
            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
        </div>
    );
}

export default TakeExam;
