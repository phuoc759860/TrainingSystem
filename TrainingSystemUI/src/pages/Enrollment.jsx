import { useEffect, useState } from "react";
import useDebouncedValue from "../hooks/useDebouncedValue";
import {
    getEnrollments,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment
} from "../services/EnrollmentService";

import { getUsers } from "../services/UserService";
import { getCourses } from "../services/CourseService";
import TableSkeleton from "../components/TableSkeleton";
import useToast from "../hooks/useToast";
import ConfirmDialog from "../components/ConfirmDialog";
import SidePanel from "../components/SidePanel";
import Pagination from "../components/Pagination";

const blankForm = () => ({
    userID: "",
    courseID: "",
    status: "In Progress"
});

function Enrollment() {

    const [enrollments, setEnrollments] = useState([]);
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const { showToast, toastEl } = useToast();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [form, setForm] = useState(blankForm());
    const debouncedSearch = useDebouncedValue(search);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        loadEnrollments();
        loadUsers();
        loadCourses();
    }, [debouncedSearch, page]);

    const loadEnrollments = async () => {
        setLoading(true);
        try {
            const res = await getEnrollments(page, 20, debouncedSearch);
            setEnrollments(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load enrollments. Try refreshing.", "error");
        }
        finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        const res = await getUsers(1, 100);
        setUsers(res.data.items);
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

    const openEditPanel = (enrollment) => {
        setEditingId(enrollment.enrollmentID);
        setForm({
            userID: enrollment.userID,
            courseID: enrollment.courseID,
            status: enrollment.status
        });
        setPanelOpen(true);
    };

    const handleSubmit = async () => {
        if (editingId == null && (!form.userID || !form.courseID)) {
            showToast("User and course are required.", "error");
            return;
        }

        setSaving(true);

        try {

            if (editingId == null) {
                await createEnrollment(form);
                showToast("Enrollment created.", "success");
            }
            else {
                await updateEnrollment(editingId, { status: form.status });
                showToast("Enrollment updated.", "success");
            }

            closePanel();
            loadEnrollments();

        }
        catch (err) {
            console.error(err);
            const message = err?.response?.status === 409
                ? "This user is already enrolled in that course."
                : "Operation failed.";
            showToast(message, "error");
        }
        finally {
            setSaving(false);
        }

    };

    const handleDelete = (enrollment) => {
        setConfirmState({
            title: "Remove this enrollment?",
            message: `${enrollment.userName} will be unenrolled from ${enrollment.courseTitle}.`,
            confirmLabel: "Remove enrollment",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteEnrollment(enrollment.enrollmentID);
                    showToast("Enrollment removed.", "success");
                    loadEnrollments();
                }
                catch (err) {
                    console.error(err);
                    showToast("Couldn't remove that enrollment.", "error");
                }
            }
        });
    };

    const statusPillClass = (status) =>
        status === "Completed" ? "badge badge-success" :
        status === "Dropped" ? "badge badge-danger" :
        "badge";

    return (

        <div className="page">

            <div className="welcome-banner">
                <h2>Enrollment Management</h2>
                <p>Track student enrollments and progress</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Enrollments</h2>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search enrollments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={openCreatePanel}>
                        + New Enrollment
                    </button>
                </div>
            </div>

            {loading ? (
                <TableSkeleton rows={5} columns={5} />
            ) : enrollments.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">🎓</div>
                    <p>
                        {search
                            ? "No enrollments match your search."
                            : "No enrollments yet. Create one to get started."}
                    </p>
                </div>
            ) : (
                <div className="table-scroll">
                <table className="table-modern fade-in">

                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Course</th>
                            <th>Enroll Date</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {
                            enrollments.map(enrollment => (
                                <tr key={enrollment.enrollmentID}>
                                    <td style={{ fontWeight: 500 }}>{enrollment.userName}</td>
                                    <td>{enrollment.courseTitle}</td>
                                    <td>{new Date(enrollment.enrollDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={statusPillClass(enrollment.status)}>
                                            {enrollment.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => openEditPanel(enrollment)}
                                        >
                                            Edit
                                        </button>{" "}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(enrollment)}
                                        >
                                            Delete
                                        </button>
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
                title={editingId == null ? "Add Enrollment" : "Edit Enrollment"}
                subtitle={editingId != null ? "Only the status can be changed here" : undefined}
                onClose={closePanel}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={closePanel} disabled={saving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving && <span className="spinner" />}
                            {editingId == null
                                ? (saving ? "Adding..." : "Add Enrollment")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>User</label>
                    <select
                        name="userID"
                        value={form.userID}
                        onChange={handleChange}
                        disabled={editingId != null}
                    >
                        <option value="">Select User</option>
                        {
                            users.map(user => (
                                <option key={user.userID} value={user.userID}>
                                    {user.name}
                                </option>
                            ))
                        }
                    </select>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Course</label>
                    <select
                        name="courseID"
                        value={form.courseID}
                        onChange={handleChange}
                        disabled={editingId != null}
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

                <div className="field">
                    <label>Status</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Dropped">Dropped</option>
                    </select>
                </div>
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            {toastEl}

        </div>

    );
}

export default Enrollment;