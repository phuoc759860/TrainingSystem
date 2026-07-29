import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz, addQuestion, deleteQuestion } from "../services/QuizService";
import { getLessons } from "../services/LessonService";
import { getCourses } from "../services/CourseService";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import SidePanel from "../components/SidePanel";

function QuizManagement() {
    const navigate = useNavigate();
    const { role } = useAuth();
    const canManage = role === "Admin" || role === "Trainer";

    const [quizzes, setQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [courseFilter, setCourseFilter] = useState("");
    const [lessonFilter, setLessonFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [confirmState, setConfirmState] = useState(null);

    const [panelOpen, setPanelOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", lessonID: "", timeLimitMinutes: 10, passingScore: 70 });

    const [questionPanelOpen, setQuestionPanelOpen] = useState(false);
    const [activeQuizId, setActiveQuizId] = useState(null);
    const [qForm, setQForm] = useState({ questionText: "", options: ["", ""], correctIndex: 0, points: 1 });

    useEffect(() => {
        loadQuizzes();
        loadCourses();
    }, []);

    useEffect(() => {
        if (courseFilter) loadLessonsByCourse(courseFilter);
    }, [courseFilter]);

    useEffect(() => {
        loadQuizzes();
    }, [courseFilter, lessonFilter]);

    const loadQuizzes = async () => {
        setLoading(true);
        try {
            const res = await getQuizzes(lessonFilter, courseFilter);
            setQuizzes(res.data);
        } catch {
            setToast({ message: "Couldn't load quizzes.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const loadCourses = async () => {
        const res = await getCourses("", 1, 100);
        setCourses(res.data.items);
    };

    const loadLessonsByCourse = async (courseId) => {
        const res = await getLessons("", courseId, 1, 100);
        setLessons(res.data.items);
    };

    const openCreatePanel = async () => {
        setEditingId(null);
        setForm({ title: "", description: "", lessonID: lessonFilter || "", timeLimitMinutes: 10, passingScore: 70 });
        if (lessons.length === 0) {
            try {
                const res = await getLessons("", "", 1, 100);
                setLessons(res.data.items);
            } catch { }
        }
        setPanelOpen(true);
    };

    const openEditPanel = async (quiz) => {
        setEditingId(quiz.quizID);
        setForm({ title: quiz.title, description: quiz.description || "", lessonID: quiz.lessonID, timeLimitMinutes: quiz.timeLimitMinutes, passingScore: quiz.passingScore });
        try {
            const res = await getLessons("", "", 1, 100);
            setLessons(res.data.items);
        } catch { }
        setPanelOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.lessonID) {
            setToast({ message: "Title and lesson are required.", type: "error" });
            return;
        }
        try {
            if (editingId == null) {
                await createQuiz(form);
                setToast({ message: "Quiz created.", type: "success" });
            } else {
                await updateQuiz(editingId, form);
                setToast({ message: "Quiz updated.", type: "success" });
            }
            setPanelOpen(false);
            loadQuizzes();
        } catch {
            setToast({ message: "Operation failed.", type: "error" });
        }
    };

    const handleDelete = (quiz) => {
        setConfirmState({
            title: `Delete "${quiz.title}"?`,
            message: "This will remove the quiz and all its questions.",
            confirmLabel: "Delete quiz",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteQuiz(quiz.quizID);
                    setToast({ message: "Quiz deleted.", type: "success" });
                    loadQuizzes();
                } catch {
                    setToast({ message: "Couldn't delete quiz.", type: "error" });
                }
            }
        });
    };

    const toggleActive = async (quiz) => {
        try {
            await updateQuiz(quiz.quizID, { isActive: !quiz.isActive });
            loadQuizzes();
        } catch {
            setToast({ message: "Couldn't update quiz.", type: "error" });
        }
    };

    const openQuestionPanel = (quizId) => {
        setActiveQuizId(quizId);
        setQForm({ questionText: "", options: ["", ""], correctIndex: 0, points: 1 });
        setQuestionPanelOpen(true);
    };

    const handleAddQuestion = async () => {
        if (!qForm.questionText.trim() || qForm.options.some(o => !o.trim())) {
            setToast({ message: "Fill in all options.", type: "error" });
            return;
        }
        try {
            await addQuestion(activeQuizId, qForm);
            setToast({ message: "Question added.", type: "success" });
            setQuestionPanelOpen(false);
            loadQuizzes();
        } catch {
            setToast({ message: "Couldn't add question.", type: "error" });
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        try {
            await deleteQuestion(questionId);
            setToast({ message: "Question removed.", type: "success" });
            loadQuizzes();
        } catch {
            setToast({ message: "Couldn't remove question.", type: "error" });
        }
    };

    const addOption = () => setQForm({ ...qForm, options: [...qForm.options, ""] });
    const removeOption = (idx) => {
        if (qForm.options.length <= 2) return;
        const newOpts = qForm.options.filter((_, i) => i !== idx);
        setQForm({ ...qForm, options: newOpts, correctIndex: Math.min(qForm.correctIndex, newOpts.length - 1) });
    };

    return (
        <div className="page">
            <div className="welcome-banner">
                <h2>Quiz Management</h2>
                <p>Create quizzes for lessons to test student knowledge</p>
            </div>

            <div className="page-header">
                <div><h2 style={{ marginTop: 0 }}>Quizzes</h2></div>
                {canManage && <button className="btn btn-primary" onClick={openCreatePanel}>+ New Quiz</button>}
            </div>

            <div className="card fade-in" style={{ marginBottom: 24 }}>
                <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div className="field">
                        <label>Filter by Course</label>
                        <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setLessonFilter(""); }}>
                            <option value="">All Courses</option>
                            {courses.map(c => <option key={c.courseID} value={c.courseID}>{c.title}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label>Filter by Lesson</label>
                        <select value={lessonFilter} onChange={(e) => setLessonFilter(e.target.value)}>
                            <option value="">All Lessons</option>
                            {lessons.map(l => <option key={l.lessonID} value={l.lessonID}>{l.title}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-row"><span className="spinner" /> Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📝</div>
                    <p>No quizzes yet. Create one to get started.</p>
                </div>
            ) : (
                <div className="materials-grid fade-in">
                    {quizzes.map(quiz => (
                        <div key={quiz.quizID} className="material-card card">
                            <div className="material-info">
                                <div className="material-header">
                                    <h4 className="material-title">{quiz.title}</h4>
                                    <span className={`badge ${quiz.isActive ? "" : "badge-neutral"}`}
                                        style={quiz.isActive ? { background: "var(--success-bg)", color: "var(--success)" } : { background: "var(--surface-sunken)", color: "var(--ink-soft)" }}>
                                        {quiz.isActive ? "Active" : "Draft"}
                                    </span>
                                </div>
                                <span className="pill pill-mc">{quiz.lessonTitle}</span>
                                <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--ink-soft)" }}>
                                    {quiz.questionCount} questions • {quiz.timeLimitMinutes} min • Pass: {quiz.passingScore}%
                                </p>
                                <div className="material-links">
                                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/quizzes/${quiz.quizID}/attempts`)}>
                                        Attempts
                                    </button>
                                    {canManage && (
                                        <>
                                            <button className="btn btn-outline btn-sm" onClick={() => openQuestionPanel(quiz.quizID)}>
                                                + Question
                                            </button>
                                            <button className="btn btn-outline btn-sm" onClick={() => toggleActive(quiz)}>
                                                {quiz.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        </>
                                    )}
                                </div>
                                {canManage && (
                                    <div className="material-manage">
                                        <button className="btn btn-outline btn-sm" onClick={() => openEditPanel(quiz)}>Edit</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(quiz)}>Delete</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <SidePanel open={panelOpen} title={editingId == null ? "Create Quiz" : "Edit Quiz"} onClose={() => setPanelOpen(false)}
                footer={<>
                    <button className="btn btn-outline" onClick={() => setPanelOpen(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>{editingId == null ? "Create" : "Save"}</button>
                </>}>
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Title</label>
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Quiz title" autoFocus />
                </div>
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Description</label>
                    <textarea rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                </div>
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Lesson</label>
                    <select value={form.lessonID} onChange={e => setForm({ ...form, lessonID: e.target.value })}>
                        <option value="">Select Lesson</option>
                        {lessons.map(l => <option key={l.lessonID} value={l.lessonID}>{l.title}</option>)}
                    </select>
                </div>
                <div className="form-grid">
                    <div className="field">
                        <label>Time Limit (min)</label>
                        <input type="number" min="1" value={form.timeLimitMinutes} onChange={e => setForm({ ...form, timeLimitMinutes: parseInt(e.target.value) || 10 })} />
                    </div>
                    <div className="field">
                        <label>Passing Score (%)</label>
                        <input type="number" min="0" max="100" value={form.passingScore} onChange={e => setForm({ ...form, passingScore: parseInt(e.target.value) || 70 })} />
                    </div>
                </div>
            </SidePanel>

            <SidePanel open={questionPanelOpen} title="Add Question" onClose={() => setQuestionPanelOpen(false)} wide
                footer={<>
                    <button className="btn btn-outline" onClick={() => setQuestionPanelOpen(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleAddQuestion}>Add</button>
                </>}>
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Question</label>
                    <textarea rows="2" value={qForm.questionText} onChange={e => setQForm({ ...qForm, questionText: e.target.value })} placeholder="Enter question text" autoFocus />
                </div>
                {qForm.options.map((opt, idx) => (
                    <div className="field" key={idx} style={{ marginBottom: 8 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="radio" name="correct" checked={qForm.correctIndex === idx} onChange={() => setQForm({ ...qForm, correctIndex: idx })} />
                            Option {idx + 1} {qForm.correctIndex === idx && <span style={{ color: "var(--success)", fontSize: "12px" }}>(Correct)</span>}
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input value={opt} onChange={e => { const newOpts = [...qForm.options]; newOpts[idx] = e.target.value; setQForm({ ...qForm, options: newOpts }); }} placeholder={`Option ${idx + 1}`} />
                            {qForm.options.length > 2 && <button className="btn btn-danger btn-sm" onClick={() => removeOption(idx)}>✕</button>}
                        </div>
                    </div>
                ))}
                <button className="btn btn-outline btn-sm" onClick={addOption} style={{ marginBottom: 16 }}>+ Add Option</button>
                <div className="field">
                    <label>Points</label>
                    <input type="number" min="1" value={qForm.points} onChange={e => setQForm({ ...qForm, points: parseInt(e.target.value) || 1 })} style={{ width: 80 }} />
                </div>
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            <Toast toast={toast} onDone={() => setToast(null)} />
        </div>
    );
}

export default QuizManagement;
