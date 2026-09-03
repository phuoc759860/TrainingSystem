import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { getUsers } from "../services/UserService";
import TableSkeleton from "../components/TableSkeleton";
import {
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    unpublishCourse
} from "../services/CourseService";
import { getMyEnrollments, enrollSelf } from "../services/EnrollmentService";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import ConfirmDialog from "../components/ConfirmDialog";
import SidePanel from "../components/SidePanel";
import Pagination from "../components/Pagination";

const blankForm = () => ({
    title: "",
    description: "",
    trainerID: ""
});

function Course() {
    const { role } = useAuth();
    const canManage = role === "Admin" || role === "Trainer";

    const [courses, setCourses] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const { showToast, toastEl } = useToast();
    const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
    const [enrolling, setEnrolling] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [form, setForm] = useState(blankForm());
    const debouncedSearch = useDebouncedValue(search);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        loadCourses();
        if (role === "Student") loadEnrollments();
    }, [debouncedSearch, page]);

    useEffect(() => {
        if (role === "Admin") {
            loadTrainers();
        }
    }, []);

    const loadTrainers = async () => {
        const res = await getUsers(1, 100);
        setTrainers(res.data.items.filter(u => u.roleName === "Trainer"));
    };

    const loadCourses = async () => {
        setLoading(true);
        try {
            const res = await getCourses(debouncedSearch, page);
            setCourses(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch (err) { console.error(err);
            showToast("Couldn't load courses. Try refreshing.", "error");
        }
        finally {
            setLoading(false);
        }
    };

    const loadEnrollments = async () => {
        try {
            const res = await getMyEnrollments();
            const ids = new Set(res.data.filter(e => e.status !== "Dropped").map(e => e.courseID));
            setEnrolledCourseIds(ids);
        } catch (err) { console.error(err); }
    };

    const handleEnroll = async (courseId) => {
        setEnrolling(courseId);
        try {
            await enrollSelf(courseId);
            showToast("Successfully enrolled!", "success");
            setEnrolledCourseIds(prev => new Set([...prev, courseId]));
        } catch (err) {
            const msg = err.response?.data?.message || "Enrollment failed.";
            showToast(msg, "error");
        } finally {
            setEnrolling(null);
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
    };

    const openCreatePanel = () => {
        setEditingId(null);
        setForm(blankForm());
        setPanelOpen(true);
    };

    const openEditPanel = (course) => {
        setEditingId(course.courseID);
        setForm({
            title: course.title,
            description: course.description,
            trainerID: course.trainerID
        });
        setPanelOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            showToast("Course title is required.", "error");
            return;
        }
        if (role === "Admin" && !form.trainerID) {
            showToast("Please select a trainer.", "error");
            return;
        }

        const data = { ...form };
        if (role === "Trainer") {
            delete data.trainerID;
        }

        setSaving(true);

        try {
            if (editingId == null) {
                await createCourse(data);
                showToast("Course created.", "success");
            } else {
                await updateCourse(editingId, data);
                showToast("Course updated.", "success");
            }

            closePanel();
            loadCourses();
        }
        catch (err) {
            console.error(err);
            showToast("Operation failed.", "error");
        }
        finally {
            setSaving(false);
        }
    };

    const handleTogglePublish = async (course) => {
        try {
            if (course.isPublished) {
                await unpublishCourse(course.courseID);
                showToast(`"${course.title}" unpublished.`, "success");
            } else {
                await publishCourse(course.courseID);
                showToast(`"${course.title}" published.`, "success");
            }
            loadCourses();
        }
        catch (err) { console.error(err);
            showToast("Couldn't change publish state.", "error");
        }
    };

    const handleDelete = (course) => {
        setConfirmState({
            title: `Delete "${course.title}"?`,
            message: "This removes the course along with its lessons, exams, and enrollments. This can't be undone.",
            confirmLabel: "Delete course",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteCourse(course.courseID);
                    showToast("Course deleted.", "success");
                    loadCourses();
                }
                catch (err) { console.error(err);
                    showToast("Couldn't delete that course.", "error");
                }
            }
        });
    };

    return (
        <div className="page">

            <div className="welcome-banner">
                <h2>Course Management</h2>
                <p>Organize and manage your training courses</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Courses</h2>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search course..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {canManage && (
                        <button className="btn btn-primary" onClick={openCreatePanel}>
                            + New Course
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <TableSkeleton rows={5} columns={6} />
            ) : courses.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon"><BookOpen size={28} strokeWidth={1.7} /></div>
                    <p>
                        {search
                            ? "No courses match your search."
                            : "No courses yet. Create one to get started."}
                    </p>
                </div>
            ) : (
                <div className="table-scroll">
                <table className="table-modern fade-in">

                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Trainer</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {
                            courses.map(course => (
                                <tr key={course.courseID}>
                                    <td style={{ fontWeight: 500 }}>{course.title}</td>
                                    <td>{course.description}</td>
                                    <td><span className="pill pill-mc">{course.trainerName}</span></td>
                                    <td>
                                        {course.isPublished
                                            ? <span className="badge badge-success">Published</span>
                                            : <span className="badge badge-warning">Draft</span>
                                        }
                                    </td>
                                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                        {canManage && (
                                            <>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => handleTogglePublish(course)}
                                                >
                                                    {course.isPublished ? "Unpublish" : "Publish"}
                                                </button>{" "}
                                                <button className="btn btn-outline btn-sm" onClick={() => openEditPanel(course)}>
                                                    Edit
                                                </button>{" "}
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course)}>
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                        {role === "Student" && (
                                            enrolledCourseIds.has(course.courseID) ? (
                                                <span className="pill pill-mc">Enrolled</span>
                                            ) : (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    disabled={enrolling === course.courseID}
                                                    onClick={() => handleEnroll(course.courseID)}
                                                >
                                                    {enrolling === course.courseID ? "Joining..." : "Enroll"}
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>

                </table>
                </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Add Course" : "Edit Course"}
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
                                ? (saving ? "Adding..." : "Add Course")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Course Title</label>
                    <input
                        name="title"
                        placeholder="Course Title"
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
                        placeholder="Description"
                        value={form.description}
                        onChange={handleChange}
                    />
                </div>

                {editingId != null && (
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: -8 }}>
                        Saving changes returns this course to draft. Republish it when ready.
                    </p>
                )}

                {role === "Admin" && (
                    <div className="field">
                        <label>Trainer</label>
                        <select
                            name="trainerID"
                            value={form.trainerID}
                            onChange={handleChange}
                        >
                            <option value="">Select Trainer</option>
                            {trainers.map(trainer => (
                                <option key={trainer.userID} value={trainer.userID}>
                                    {trainer.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            {toastEl}

        </div>
    );
}

export default Course;