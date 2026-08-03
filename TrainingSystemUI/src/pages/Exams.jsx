import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getExams,
    createExam,
    updateExam,
    deleteExam,
    publishExam,
    unpublishExam
} from "../services/ExamService";

import useAuth from "../hooks/useAuth";
import { getCourses } from "../services/CourseService";
import useToast from "../hooks/useToast";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import SidePanel from "../components/SidePanel";

const blankForm = () => ({
    title: "",
    courseID: "",
    maxAttempts: "",
    timeLimitMinutes: "",
    questionsPerAttempt: "",
    questionCount: 5
});

function Exam() {
    const navigate = useNavigate();
    const { role } = useAuth();
    const canManage = role === "Admin" || role === "Trainer";

    const [exams, setExams] = useState([]);
    const [courses, setCourses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [confirmState, setConfirmState] = useState(null);
    const { showToast, toastEl } = useToast();
    const [panelOpen, setPanelOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [form, setForm] = useState(blankForm());

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        loadExams();
        loadCourses();
    }, [search, page]);

    const loadExams = async () => {
        setLoading(true);
        try {
            const res = await getExams(page, 20, search);
            setExams(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch (err) { console.error(err);
            showToast("Couldn't load exams. Try refreshing.", "error");
        }
        finally {
            setLoading(false);
        }
    };

    const loadCourses = async () => {
        const res = await getCourses("", 1, 100);
        setCourses(res.data.items);
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const closePanel = () => {
        setPanelOpen(false);
        setEditingId(null);
        setForm(blankForm());
    };

    const openCreatePanel = () => {
        setEditingId(null);
        setForm(blankForm());
        setPanelOpen(true);
    };

    const openEditPanel = (exam) => {
        setEditingId(exam.examID);
        setForm({
            title: exam.title,
            courseID: exam.courseID,
            maxAttempts: exam.maxAttempts || "",
            timeLimitMinutes: exam.timeLimitMinutes || "",
            questionsPerAttempt: exam.questionsPerAttempt || "",
            questionCount: 5
        });
        setPanelOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.courseID) {
            showToast("Title and course are required.", "error");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                title: form.title,
                courseID: Number(form.courseID),
                maxAttempts: Number(form.maxAttempts) || 0,
                timeLimitMinutes: Number(form.timeLimitMinutes) || 0,
                questionsPerAttempt: Number(form.questionsPerAttempt) || 0
            };

            if (editingId == null) {
                const res = await createExam(payload);

                const count = Math.max(1, Math.min(50, Number(form.questionCount) || 1));

                closePanel();
                navigate(`/questions?examId=${res.data.examID}&count=${count}`);
                return;
            }
            else {
                await updateExam(editingId, payload);
                showToast("Exam updated.", "success");
            }

            closePanel();
            loadExams();
        }
        catch (err) { console.error(err);
            showToast("Something went wrong saving that exam.", "error");
        }
        finally {
            setSaving(false);
        }
    };

    const handleTogglePublish = async (exam) => {
        try {
            if (exam.isPublished) {
                await unpublishExam(exam.examID);
                showToast(`"${exam.title}" unpublished.`, "success");
            } else {
                await publishExam(exam.examID);
                showToast(`"${exam.title}" published.`, "success");
            }
            loadExams();
        }
        catch (err) { console.error(err);
            showToast("Couldn't change publish state.", "error");
        }
    };

    const handleDelete = (exam) => {
        setConfirmState({
            title: `Delete "${exam.title}"?`,
            message: "This removes the exam and its question bank. This can't be undone.",
            confirmLabel: "Delete exam",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteExam(exam.examID);
                    showToast("Exam deleted.", "success");
                    loadExams();
                }
                catch (err) { console.error(err);
                    showToast("Couldn't delete that exam.", "error");
                }
            }
        });
    };

    return (
        <div className="page">

            <div className="welcome-banner">
                <h2>Exam Management</h2>
                <p>Create and manage exams for your courses</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Exams</h2>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search exams or courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {canManage && (
                        <button className="btn btn-primary" onClick={openCreatePanel}>
                            + New Exam
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading exams...
                </div>
            ) : exams.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📋</div>
                    <p>
                        {search
                            ? "No exams match your search."
                            : "No exams yet. Create one to get started."}
                    </p>
                </div>
            ) : (
                <table className="table-modern fade-in">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Course</th>
                            <th>Attempts</th>
                            <th>Time Limit</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {
                            exams.map(exam => (
                                <tr key={exam.examID}>
                                    <td style={{ fontWeight: 500 }}>{exam.title}</td>
                                    <td>
                                        <span className="pill pill-mc">{exam.courseTitle}</span>
                                    </td>
                                    <td>
                                        {exam.maxAttempts > 0
                                            ? <span className="badge badge-success">{exam.maxAttempts} max</span>
                                            : <span className="badge" style={{ background: "var(--surface-sunken)", color: "var(--ink-soft)" }}>Unlimited</span>
                                        }
                                    </td>
                                    <td>
                                        {exam.timeLimitMinutes > 0
                                            ? <span className="badge badge-success">{exam.timeLimitMinutes} min</span>
                                            : <span className="badge" style={{ background: "var(--surface-sunken)", color: "var(--ink-soft)" }}>No limit</span>
                                        }
                                    </td>
                                    <td>
                                        {exam.isPublished
                                            ? <span className="badge badge-success">Published</span>
                                            : <span className="badge badge-warning">Draft</span>
                                        }
                                        {exam.questionsPerAttempt > 0 && (
                                            <span className="badge" style={{ background: "var(--surface-sunken)", color: "var(--ink-soft)", marginLeft: 6 }}>
                                                {exam.questionsPerAttempt} per attempt
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => navigate(`/exams/${exam.examID}/take`)}
                                        >
                                            Take Exam
                                        </button>{" "}

                                        {canManage && (
                                            <>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => navigate(`/questions?examId=${exam.examID}`)}
                                                >
                                                    Manage Questions
                                                </button>{" "}
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => handleTogglePublish(exam)}
                                                >
                                                    {exam.isPublished ? "Unpublish" : "Publish"}
                                                </button>{" "}
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => openEditPanel(exam)}
                                                >
                                                    Edit
                                                </button>{" "}
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(exam)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Create Exam" : "Edit Exam"}
                subtitle={editingId == null
                    ? "Set up a new exam, then add its questions."
                    : `Editing "${form.title}"`}
                onClose={closePanel}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={closePanel} disabled={saving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving && <span className="spinner" />}
                            {editingId == null
                                ? (saving ? "Creating..." : "Create Exam")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Exam Title</label>
                    <input
                        name="title"
                        placeholder="e.g. Midterm Assessment"
                        value={form.title}
                        onChange={handleChange}
                        autoFocus
                    />
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Course</label>
                    <select
                        name="courseID"
                        value={form.courseID}
                        onChange={handleChange}
                    >
                        <option value="">Select Course</option>
                        {
                            courses.map(course => (
                                <option key={course.courseID} value={course.courseID}>
                                    {course.title}
                                </option>
                            ))
                        }
                    </select>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Max Attempts</label>
                    <input
                        type="number"
                        name="maxAttempts"
                        min="0"
                        max="99"
                        placeholder="0 = unlimited"
                        value={form.maxAttempts}
                        onChange={handleChange}
                    />
                    <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                        Set to 0 for unlimited attempts.
                    </p>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Time Limit (minutes)</label>
                    <input
                        type="number"
                        name="timeLimitMinutes"
                        min="0"
                        max="300"
                        placeholder="0 = no limit"
                        value={form.timeLimitMinutes}
                        onChange={handleChange}
                    />
                    <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                        Set to 0 for no time limit. Students get a countdown timer and auto-submit on expiry.
                    </p>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Questions Per Attempt</label>
                    <input
                        type="number"
                        name="questionsPerAttempt"
                        min="0"
                        max="200"
                        placeholder="0 = all questions"
                        value={form.questionsPerAttempt}
                        onChange={handleChange}
                    />
                    <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                        Set how many random questions each student gets per attempt. Leave 0 to use the whole question bank.
                    </p>
                </div>

                {editingId == null && (
                    <div className="field">
                        <label>Number of Questions</label>
                        <input
                            type="number"
                            name="questionCount"
                            min="1"
                            max="50"
                            value={form.questionCount}
                            onChange={handleChange}
                        />
                        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                            You'll be taken straight to the Question Bank to fill these in.
                        </p>
                    </div>
                )}
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            {toastEl}

        </div>
    );
}

export default Exam;
