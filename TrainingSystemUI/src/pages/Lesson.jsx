import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    getLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    getLessonVersions
} from "../services/LessonService";
import useAuth from "../hooks/useAuth";
import { getCourses } from "../services/CourseService";
import { getProgress } from "../services/LessonProgressService";
import useToast from "../hooks/useToast";
import ConfirmDialog from "../components/ConfirmDialog";
import SidePanel from "../components/SidePanel";
import Pagination from "../components/Pagination";

const blankForm = () => ({
    title: "",
    description: "",
    courseID: "",
    orderIndex: 0,
    unlocksAfterLessonID: ""
});

function Lesson() {

    const navigate = useNavigate();
    const location = useLocation();
    const [lessons, setLessons] = useState([]);
    const [courses, setCourses] = useState([]);
    const [courseLessons, setCourseLessons] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [courseId, setCourseId] = useState("");
    const [completionFilter, setCompletionFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const { showToast, toastEl } = useToast();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { role } = useAuth();
    const canManage = role === "Admin" || role === "Trainer";

    const [form, setForm] = useState(blankForm());
    const [versions, setVersions] = useState([]);
    const [showVersions, setShowVersions] = useState(false);

    useEffect(() => {
        loadLessons();
        loadProgress();
    }, [search, courseId, page]);

    useEffect(() => {
        loadProgress();
    }, [location.pathname]);

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        if (form.courseID) {
            loadCourseLessons(form.courseID);
        } else {
            setCourseLessons([]);
        }
    }, [form.courseID]);

    const loadLessons = async () => {
        setLoading(true);
        try {
            const res = await getLessons(search, courseId, page);
            setLessons(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch (err) { console.error(err);
            showToast("Couldn't load lessons. Try refreshing.", "error");
        }
        finally {
            setLoading(false);
        }
    };

    const loadProgress = async () => {
        try {
            const res = await getProgress();
            const map = {};
            (res.data || []).forEach(p => {
                if (!map[p.lessonID]) {
                    map[p.lessonID] = p;
                }
            });
            setProgressMap(map);
        } catch (err) {
            console.error("[Lesson] loadProgress failed:", err);
        }
    };

    const loadCourses = async () => {
        const res = await getCourses("", 1, 100);
        setCourses(res.data.items);
    };

    const loadCourseLessons = async (cId) => {
        try {
            const res = await getLessons("", cId, 1, 100);
            setCourseLessons(res.data.items || []);
        } catch (err) { console.error(err);
            setCourseLessons([]);
        }
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
        setVersions([]);
        setShowVersions(false);
    };

    const openCreatePanel = () => {
        setEditingId(null);
        setForm(blankForm());
        setPanelOpen(true);
    };

    const openEditPanel = async (lesson) => {
        setEditingId(lesson.lessonID);
        setForm({
            title: lesson.title,
            description: lesson.description || "",
            courseID: lesson.courseID,
            orderIndex: lesson.orderIndex || 0,
            unlocksAfterLessonID: lesson.unlocksAfterLessonID || ""
        });
        setPanelOpen(true);

        // Load version history
        try {
            const res = await getLessonVersions(lesson.lessonID);
            setVersions(res.data || []);
        } catch (err) { console.error(err);
            setVersions([]);
        }
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
                description: form.description || null,
                courseID: Number(form.courseID),
                orderIndex: Number(form.orderIndex) || 0,
                unlocksAfterLessonID: form.unlocksAfterLessonID ? Number(form.unlocksAfterLessonID) : null
            };

            if (editingId == null) {
                await createLesson(payload);
                showToast("Lesson created.", "success");
            }
            else {
                await updateLesson(editingId, payload);
                showToast("Lesson updated.", "success");
            }

            closePanel();
            loadLessons();
        }
        catch (err) {
            console.error(err);
            showToast("Operation failed.", "error");
        }
        finally {
            setSaving(false);
        }
    };

    const handleDelete = (lesson) => {
        setConfirmState({
            title: `Delete "${lesson.title}"?`,
            message: "This can't be undone.",
            confirmLabel: "Delete lesson",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteLesson(lesson.lessonID);
                    showToast("Lesson deleted.", "success");
                    loadLessons();
                }
                catch (err) { console.error(err);
                    showToast("Couldn't delete that lesson.", "error");
                }
            }
        });
    };

    const filteredLessons = lessons.filter(lesson => {
        if (completionFilter === "") return true;
        const p = progressMap[lesson.lessonID];
        const completed = p?.isCompleted || false;
        return completionFilter === "completed" ? completed : !completed;
    });

    // Available prerequisite lessons (same course, excluding current)
    const prereqOptions = courseLessons.filter(l =>
        editingId ? l.lessonID !== editingId : true
    );

    return (
        <div className="page">

            <div className="welcome-banner">
                <h2>Lesson Management</h2>
                <p>Manage lessons and course content
                    {!canManage && lessons.length > 0 && (
                        <> &mdash; {Object.values(progressMap).filter(p => p.isCompleted).length}/{lessons.length} completed</>
                    )}
                </p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Lessons</h2>
                </div>

                {canManage && (
                    <button className="btn btn-primary" onClick={openCreatePanel}>
                        + New Lesson
                    </button>
                )}
            </div>

            <div className="card fade-in" style={{ marginBottom: 24 }}>
                <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div className="field">
                        <label>Search</label>
                        <input
                            placeholder="Search lesson..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Filter by Course</label>
                        <select
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                        >
                            <option value="">All Courses</option>
                            {courses.map(c => (
                                <option key={c.courseID} value={c.courseID}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label>Status</label>
                        <select
                            value={completionFilter}
                            onChange={(e) => setCompletionFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="completed">Completed</option>
                            <option value="incomplete">Not Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading lessons...
                </div>
            ) : filteredLessons.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">&#128213;</div>
                    <p>
                        {search || courseId || completionFilter
                            ? "No lessons match your filters."
                            : "No lessons yet. Create one to get started."}
                    </p>
                </div>
            ) : (
                <table className="table-modern fade-in">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Course</th>
                            <th>Prerequisite</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredLessons.map(lesson => {
                            const p = progressMap[lesson.lessonID];
                            const completed = p?.isCompleted || false;
                            return (
                                <tr key={lesson.lessonID}>
                                    <td style={{ fontWeight: 600, color: "var(--ink-soft)" }}>{lesson.orderIndex}</td>
                                    <td style={{ fontWeight: 500 }}>{lesson.title}</td>
                                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.description}</td>
                                    <td><span className="pill pill-mc">{lesson.courseTitle}</span></td>
                                    <td>
                                        {lesson.unlocksAfterLessonTitle
                                            ? <span className="badge badge-success">After: {lesson.unlocksAfterLessonTitle}</span>
                                            : <span className="badge" style={{ background: "var(--surface-sunken)", color: "var(--ink-soft)" }}>None</span>
                                        }
                                    </td>
                                    <td>
                                        <span className={`badge ${completed ? "badge-neutral" : ""}`} style={completed ? { background: "var(--success-bg)", color: "var(--success)" } : { background: "var(--surface-sunken)", color: "var(--ink-soft)" }}>
                                            {completed ? "Done" : "Pending"}
                                        </span>
                                    </td>
                                    <td style={{ whiteSpace: "nowrap" }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => navigate(`/learn/${lesson.lessonID}`)}
                                            style={{ marginRight: 6 }}
                                        >
                                            Study
                                        </button>
                                        {canManage && (
                                            <>
                                                <button className="btn btn-outline btn-sm" onClick={() => openEditPanel(lesson)}>
                                                    Edit
                                                </button>{" "}
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(lesson)}>
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Add Lesson" : "Edit Lesson"}
                subtitle={editingId != null ? `Editing "${form.title}"` : undefined}
                onClose={closePanel}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={closePanel} disabled={saving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving && <span className="spinner" />}
                            {editingId == null
                                ? (saving ? "Adding..." : "Add Lesson")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Lesson Title</label>
                    <input
                        name="title"
                        placeholder="e.g. Introduction to Variables"
                        value={form.title}
                        onChange={handleChange}
                        autoFocus
                    />
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Description</label>
                    <textarea
                        name="description"
                        rows="3"
                        placeholder="Brief description of this lesson..."
                        value={form.description}
                        onChange={handleChange}
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
                        {courses.map(course => (
                            <option key={course.courseID} value={course.courseID}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Order Index</label>
                    <input
                        type="number"
                        name="orderIndex"
                        min="0"
                        value={form.orderIndex}
                        onChange={handleChange}
                    />
                    <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                        Controls the display order within the course (lower = first).
                    </p>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Unlocks After (Prerequisite)</label>
                    <select
                        name="unlocksAfterLessonID"
                        value={form.unlocksAfterLessonID}
                        onChange={handleChange}
                    >
                        <option value="">No prerequisite (always available)</option>
                        {prereqOptions.map(l => (
                            <option key={l.lessonID} value={l.lessonID}>
                                {l.title}
                            </option>
                        ))}
                    </select>
                    <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                        Students must complete this lesson first before accessing the current one.
                    </p>
                </div>

                {/* Version History */}
                {editingId && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setShowVersions(!showVersions)}
                            style={{ marginBottom: 8 }}
                        >
                            {showVersions ? "Hide" : "Show"} Version History ({versions.length})
                        </button>
                        {showVersions && (
                            <div style={{ maxHeight: 200, overflow: "auto" }}>
                                {versions.length === 0 ? (
                                    <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>No previous versions.</p>
                                ) : (
                                    versions.map(v => (
                                        <div key={v.lessonVersionID} style={{
                                            padding: "8px 10px", marginBottom: 4,
                                            background: "var(--surface-sunken)", borderRadius: 6, fontSize: 12
                                        }}>
                                            <div style={{ fontWeight: 600 }}>v{v.versionNumber} &mdash; {v.title}</div>
                                            <div style={{ color: "var(--ink-soft)", marginTop: 2 }}>
                                                By {v.editedByUserName} &middot; {new Date(v.savedAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            {toastEl}

        </div>
    );
}

export default Lesson;
