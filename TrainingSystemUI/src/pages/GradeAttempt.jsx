import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExamAttempt, gradeExamAttempt } from "../services/ExamResultService";
import useToast from "../hooks/useToast";

function getRubricLabel(points, max) {
    if (max === 0) return { label: "N/A", color: "var(--ink-soft)" };
    const ratio = points / max;
    if (ratio >= 0.9) return { label: "Excellent", color: "var(--success)" };
    if (ratio >= 0.7) return { label: "Good", color: "#3b82f6" };
    if (ratio >= 0.4) return { label: "Fair", color: "var(--warning)" };
    if (ratio > 0) return { label: "Poor", color: "var(--danger)" };
    return { label: "No credit", color: "var(--ink-soft)" };
}

function GradeAttempt() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [attempt, setAttempt] = useState(null);
    const [points, setPoints] = useState({});
    const [criterionScores, setCriterionScores] = useState({});
    const [notes, setNotes] = useState({});
    const [saving, setSaving] = useState(false);
    const { showToast, toastEl } = useToast();

    useEffect(() => {
        load();
    }, [id]);

    const load = async () => {
        const res = await getExamAttempt(id);
        setAttempt(res.data);

        const initial = {};
        const initialNotes = {};
        const initialCriteria = {};
        res.data.answers.forEach(a => {
            initial[a.examAnswerID] = a.pointsEarned;
            initialNotes[a.examAnswerID] = "";
            if (a.rubric?.length) {
                initialCriteria[a.examAnswerID] = {};
                a.rubric.forEach(r => {
                    initialCriteria[a.examAnswerID][r.name] = 0;
                });
            }
        });
        setPoints(initial);
        setNotes(initialNotes);
        setCriterionScores(initialCriteria);
    };

    const handlePointsChange = (answerId, value, max) => {
        const clamped = Math.max(0, Math.min(Number(value) || 0, max));
        setPoints(prev => ({ ...prev, [answerId]: clamped }));
    };

    const handleCriterionChange = (answerId, name, value, max) => {
        const clamped = Math.max(0, Math.min(Number(value) || 0, max));
        setCriterionScores(prev => ({
            ...prev,
            [answerId]: { ...prev[answerId], [name]: clamped }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                answers: attempt.answers
                    .filter(a => a.needsGrading)
                    .map(a => {
                        const criteria = criterionScores[a.examAnswerID];
                        const hasCriteria = criteria && Object.keys(criteria).length > 0;
                        return {
                            examAnswerID: a.examAnswerID,
                            pointsEarned: points[a.examAnswerID] ?? 0,
                            criterionScores: hasCriteria
                                ? Object.keys(criteria).map(name => ({
                                    name,
                                    points: criteria[name] ?? 0
                                }))
                                : null
                        };
                    })
            };

            await gradeExamAttempt(id, payload);
            showToast("Grading saved.", "success");
            setTimeout(() => navigate("/exam-results"), 800);
        }
        catch (err) {
            console.error(err);
            showToast("Failed to save grading.", "error");
        }
        finally {
            setSaving(false);
        }
    };

    if (!attempt) {
        return (
            <div className="page">
                <div className="loading-row">
                    <span className="spinner" /> Loading attempt...
                </div>
            </div>
        );
    }

    const gradingAnswers = attempt.answers.filter(a => a.needsGrading);
    const totalMax = gradingAnswers.reduce((s, a) => s + a.maxScore, 0);
    const totalEarned = gradingAnswers.reduce((s, a) => s + (points[a.examAnswerID] ?? 0), 0);
    const gradedCount = attempt.answers.filter(a => !a.needsGrading).length;

    return (
        <div className="page">
            <div className="welcome-banner">
                <h2>Grade Attempt</h2>
                <p>{attempt.examTitle} &mdash; {attempt.userName}</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Submission Details</h2>
                    <p className="submission-date">
                        Submitted {new Date(attempt.submittedAt).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="stat-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card stat-card-purple">
                    <div className="num stat-card-num">{attempt.score}%</div>
                    <div className="label stat-label">Current Score</div>
                </div>
                <div className={`stat-card ${attempt.passed ? "stat-card-green" : "stat-card-coral"}`}>
                    <span className="badge stat-card-badge">
                        {attempt.passed ? "\u2713 Passed" : "\u2717 Failed"}
                    </span>
                    <div className="label stat-label">Status</div>
                </div>
                <div className={`stat-card ${attempt.needsGrading ? "stat-card-yellow" : "stat-card-blue"}`}>
                    <span className="badge stat-card-badge">
                        {attempt.needsGrading ? `${gradingAnswers.length} pending` : "Fully graded"}
                    </span>
                    <div className="label stat-label">{gradedCount}/{attempt.answers.length} graded</div>
                </div>
                {gradingAnswers.length > 0 && (
                    <div className="stat-card stat-card-blue">
                        <div className="num stat-card-num">{totalEarned}/{totalMax}</div>
                        <div className="label stat-label">Grading Points</div>
                    </div>
                )}
            </div>

            {attempt.answers.map((a, i) => {
                const rubric = a.needsGrading
                    ? getRubricLabel(points[a.examAnswerID] ?? 0, a.maxScore)
                    : null;

                const borderClass = a.needsGrading ? "grade-card-warning"
                    : a.isCorrect ? "grade-card-success" : "grade-card-danger";

                return (
                    <div key={a.examAnswerID} className={`card ${borderClass}`}>
                        <div className="grade-question-header">
                            <p className="grade-question-text">
                                {i + 1}. {a.content}{" "}
                                <span className="grade-pts-label">
                                    ({a.maxScore} pts)
                                </span>
                            </p>
                            {a.needsGrading ? (
                                <span className="badge badge-danger">Needs Grading</span>
                            ) : (
                                <span className={`badge ${a.isCorrect ? "badge-success" : "badge-danger"}`}>
                                    {a.isCorrect ? `+${a.pointsEarned} pts` : "Incorrect"}
                                </span>
                            )}
                        </div>

                        {/* Student answer display */}
                        <div className={`student-answer-box ${a.needsGrading ? "" : "mb-0"}`}>
                            <div className="student-answer-label">Student Answer</div>
                            <div className="student-answer-text">{a.answer || "(no answer)"}</div>
                        </div>

                        {/* Correct answer for MC */}
                        {a.questionType === "MultipleChoice" && (
                            <p className="correct-answer-hint">
                                Correct answer: <strong>{a.correctAnswer}</strong>
                            </p>
                        )}

                        {/* Grading rubric */}
                        {a.needsGrading && (
                            <div className="grading-section">
                                <div className="grading-row">
                                    {/* Slider */}
                                    <div className="grading-slider-col">
                                        <div className="grading-slider-header">
                                            <label className="grading-slider-label">
                                                Points: {points[a.examAnswerID] ?? 0} / {a.maxScore}
                                            </label>
                                            {rubric && (
                                                <span className="rubric-chip" style={{ color: rubric.color, background: `${rubric.color}15` }}>
                                                    {rubric.label}
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={a.maxScore}
                                            step={a.maxScore <= 10 ? 1 : 0.5}
                                            value={points[a.examAnswerID] ?? 0}
                                            onChange={(e) => handlePointsChange(a.examAnswerID, e.target.value, a.maxScore)}
                                            className="grade-slider"
                                        />
                                        {/* Scale markers */}
                                        <div className="grade-scale-markers">
                                            <span>0</span>
                                            {a.maxScore <= 10 ? (
                                                Array.from({ length: a.maxScore + 1 }, (_, i) => (
                                                    <span key={i}>{i}</span>
                                                ))
                                            ) : (
                                                <>
                                                    <span>{Math.round(a.maxScore * 0.25)}</span>
                                                    <span>{Math.round(a.maxScore * 0.5)}</span>
                                                    <span>{Math.round(a.maxScore * 0.75)}</span>
                                                    <span>{a.maxScore}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Number input */}
                                    <div className="grade-num-input-wrapper">
                                        <input
                                            type="number"
                                            min="0"
                                            max={a.maxScore}
                                            step={a.maxScore <= 10 ? 1 : 0.5}
                                            value={points[a.examAnswerID] ?? 0}
                                            onChange={(e) => handlePointsChange(a.examAnswerID, e.target.value, a.maxScore)}
                                            className="grade-num-input"
                                        />
                                    </div>
                                </div>

                                {/* Quick-set buttons */}
                                <div className="grade-quick-set">
                                    {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                                        const val = Math.round(a.maxScore * frac * 10) / 10;
                                        return (
                                            <button
                                                key={frac}
                                                className={`btn btn-outline btn-sm ${(points[a.examAnswerID] ?? 0) === val ? "grade-active" : ""}`}
                                                onClick={() => handlePointsChange(a.examAnswerID, val, a.maxScore)}
                                            >
                                                {frac === 0 ? "0%" : frac === 1 ? "100%" : `${Math.round(frac * 100)}%`}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Essay rubric criteria */}
                                {a.rubric?.length > 0 && (
                                    <div className="rubric-criteria">
                                        <div className="rubric-criteria-title">
                                            Rubric criteria
                                        </div>
                                        {a.rubric.map(r => {
                                            const critPoints = criterionScores[a.examAnswerID]?.[r.name] ?? 0;
                                            return (
                                                <div key={r.name} className="rubric-criterion-row">
                                                    <span className="rubric-criterion-name">{r.name}</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={r.maxPoints}
                                                        step={r.maxPoints <= 10 ? 1 : 0.5}
                                                        value={critPoints}
                                                        onChange={(e) => handleCriterionChange(a.examAnswerID, r.name, e.target.value, r.maxPoints)}
                                                        className="grade-num-input"
                                                    />
                                                    <span className="rubric-criterion-max">/ {r.maxPoints}</span>
                                                </div>
                                            );
                                        })}
                                        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>
                                            The sum of criterion scores (capped at {a.maxScore}) overrides the slider value.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="grade-actions-bar">
                <button className="btn btn-outline" onClick={() => navigate("/exam-results")}>
                    Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Grading"}
                </button>
            </div>

            {toastEl}
        </div>
    );
}

export default GradeAttempt;
