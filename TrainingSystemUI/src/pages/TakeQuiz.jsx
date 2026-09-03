import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizForTaking, submitQuiz } from "../services/QuizService";
import useToast from "../hooks/useToast";
import { Check } from "lucide-react";

function TakeQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQ, setCurrentQ] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { showToast, toastEl } = useToast();
    const timerRef = useRef(null);

    useEffect(() => {
        loadQuiz();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [quizId]);

    useEffect(() => {
        if (timeLeft <= 0 || submitted) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [timeLeft > 0 && !submitted]);

    const loadQuiz = async () => {
        try {
            const res = await getQuizForTaking(quizId);
            setQuiz(res.data);
            setTimeLeft(res.data.timeLimitMinutes * 60);
            setLoading(false);
        } catch (err) { console.error(err);
            showToast("Couldn't load quiz.", "error");
            setLoading(false);
        }
    };

    const handleAnswer = (questionId, selectedIndex) => {
        setAnswers({ ...answers, [questionId]: selectedIndex });
    };

    const handleSubmit = async () => {
        if (submitted || submitting) return;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        const answerList = quiz.questions.map(q => ({
            quizQuestionID: q.quizQuestionID,
            selectedIndex: answers[q.quizQuestionID] ?? 0
        }));

        try {
            const res = await submitQuiz(quizId, { answers: answerList });
            setResult(res.data);
            setSubmitted(true);
        } catch (err) { console.error(err);
            showToast("Failed to submit quiz.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (loading) return <div className="page"><div className="loading-row"><span className="spinner" /> Loading quiz...</div></div>;
    if (!quiz) return <div className="page"><div className="card empty-state"><p>Quiz not found.</p></div></div>;

    if (result) {
        const percent = result.totalPoints > 0 ? Math.round(result.score * 100 / result.totalPoints) : 0;
        return (
            <div className="page">
                <div className="welcome-banner" style={result.passed ? {} : { background: "linear-gradient(135deg, var(--danger-bg), var(--surface))" }}>
                    <h2>{result.passed ? "Congratulations!" : "Keep Practicing"}</h2>
                    <p>You scored {result.score}/{result.totalPoints} ({percent}%)</p>
                </div>

                <div className="card fade-in" style={{ marginBottom: 24, textAlign: "center", padding: 32 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, fontFamily: "var(--font-display)", color: result.passed ? "var(--success)" : "var(--danger)" }}>
                        {percent}%
                    </div>
                    <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "8px 0 0" }}>
                        {result.passed ? "You passed!" : `Required: ${quiz.passingScore}% to pass`}
                    </p>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                        <button className="btn btn-outline" onClick={() => navigate(-1)}>Back to Quiz</button>
                        {!result.passed && (
                            <button className="btn btn-primary" onClick={() => { setResult(null); setSubmitted(false); setAnswers({}); setCurrentQ(0); loadQuiz(); }}>
                                Try Again
                            </button>
                        )}
                    </div>
                </div>

                <h3>Review Answers</h3>
                {result.answers?.map((ans, idx) => (
                    <div key={ans.quizQuestionID} className="card fade-in" style={{ marginBottom: 12, borderLeft: ans.correct ? "4px solid var(--success)" : "4px solid var(--danger)" }}>
                        <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Q{idx + 1}. {ans.questionText}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {ans.options?.map((opt, oIdx) => (
                                <div key={oIdx} style={{
                                    padding: "6px 12px", borderRadius: 8, fontSize: 13,
                                    background: oIdx === ans.correctIndex ? "var(--success-bg)" : oIdx === ans.selectedIndex && !ans.isCorrect ? "var(--danger-bg)" : "transparent",
                                    fontWeight: oIdx === ans.selectedIndex ? 600 : 400,
                                    border: oIdx === ans.selectedIndex ? "1px solid var(--border)" : "1px solid transparent"
                                }}>
                                    {oIdx === ans.selectedIndex && "→ "}{opt}
                                    {oIdx === ans.correctIndex && <Check size={14} strokeWidth={2.5} style={{ color: "var(--success)", verticalAlign: -2 }} />}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const questions = quiz.questions || [];
    const question = questions[currentQ];
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="page">
            <div className="welcome-banner">
                <h2>{quiz.title}</h2>
                <p>{quiz.lessonTitle} • {questions.length} questions</p>
            </div>

            <div className="card fade-in" style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: timeLeft <= 60 ? "var(--danger)" : "var(--ink-soft)" }}>
                        ⏱ {formatTime(timeLeft)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
                        Question {currentQ + 1} of {questions.length}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
                        {answeredCount}/{questions.length} answered
                    </div>
                </div>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || answeredCount === 0}>
                    {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {questions.map((q, idx) => (
                    <button key={q.quizQuestionID}
                        className={`btn btn-sm ${idx === currentQ ? "btn-primary" : answers[q.quizQuestionID] !== undefined ? "btn-outline" : "btn-outline"}`}
                        style={idx === currentQ ? {} : answers[q.quizQuestionID] !== undefined ? { borderColor: "var(--success)", color: "var(--success)" } : {}}
                        onClick={() => setCurrentQ(idx)}>
                        {idx + 1}
                    </button>
                ))}
            </div>

            {question && (
                <div className="card fade-in" style={{ padding: 28 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 16px" }}>
                        Q{currentQ + 1}. {question.questionText}
                        <span style={{ fontWeight: 400, fontSize: 12, color: "var(--ink-soft)", marginLeft: 8 }}>
                            ({question.points} {question.points === 1 ? "point" : "points"})
                        </span>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {question.options?.map((opt, oIdx) => (
                            <label key={oIdx} style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                                border: `1px solid ${answers[question.quizQuestionID] === oIdx ? "var(--brand)" : "var(--border)"}`,
                                borderRadius: 10, cursor: "pointer",
                                background: answers[question.quizQuestionID] === oIdx ? "var(--brand-bg)" : "var(--surface)",
                                transition: "all .15s"
                            }}>
                                <input type="radio" name={`q-${question.quizQuestionID}`} checked={answers[question.quizQuestionID] === oIdx}
                                    onChange={() => handleAnswer(question.quizQuestionID, oIdx)} style={{ accentColor: "var(--brand)" }} />
                                <span style={{ fontSize: 14 }}>{opt}</span>
                            </label>
                        ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>← Previous</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))} disabled={currentQ === questions.length - 1}>Next →</button>
                    </div>
                </div>
            )}

            {toastEl}
        </div>
    );
}

export default TakeQuiz;
