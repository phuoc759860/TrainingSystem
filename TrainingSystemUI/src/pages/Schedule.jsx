import { useEffect, useState, useMemo } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
    getScheduleEntries,
    createScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry
} from "../services/ScheduleService";
import { getCourses } from "../services/CourseService";
import { getLessons } from "../services/LessonService";
import ConfirmDialog from "../components/ConfirmDialog";
import useToast from "../hooks/useToast";
import SidePanel from "../components/SidePanel";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SEMESTER_WEEKS = 8;

const blankForm = () => ({
    courseID: "",
    lessonID: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:30",
    position: 0
});

const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
};

const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const formatShort = (date) =>
    date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });

function Schedule() {

    const navigate = useNavigate();
    const { role } = useAuth();
    const canManage = role === "Admin" || role === "Trainer";

    const [entries, setEntries] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [courseFilter, setCourseFilter] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const { showToast, toastEl } = useToast();
    const [form, setForm] = useState(blankForm());

    const [viewMode, setViewMode] = useState("weekly");
    const [semesterStart, setSemesterStart] = useState(() => getMonday(new Date()));

    useEffect(() => {
        loadCourses();
        if (canManage) {
            loadLessons();
        }
    }, []);

    useEffect(() => {
        loadEntries();
    }, [courseFilter]);

    const loadEntries = async () => {
        setLoading(true);
        try {
            const res = await getScheduleEntries(courseFilter);
            setEntries(res.data);
        }
        catch (err) { console.error(err);
            showToast("Couldn't load schedule. Try refreshing.", "error");
        }
        finally {
            setLoading(false);
        }
    };

    const loadCourses = async () => {
        const res = await getCourses("", 1, 10000);
        setCourses(res.data.items);
    };

    const loadLessons = async () => {
        const res = await getLessons("", "", 1, 10000);
        setLessons(res.data.items);
    };

    const filteredLessons = form.courseID
        ? lessons.filter(l => String(l.courseID) === String(form.courseID))
        : lessons;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
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

    const openEditPanel = (entry) => {
        setEditingId(entry.scheduleEntryID);
        setForm({
            courseID: entry.courseID,
            lessonID: entry.lessonID,
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            position: entry.position
        });
        setPanelOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.courseID || !form.lessonID) {
            showToast("Course and lesson are required.", "error");
            return;
        }

        setSaving(true);

        try {
            const data = {
                courseID: parseInt(form.courseID),
                lessonID: parseInt(form.lessonID),
                dayOfWeek: parseInt(form.dayOfWeek),
                startTime: form.startTime,
                endTime: form.endTime,
                position: parseInt(form.position) || 0
            };

            if (editingId == null) {
                await createScheduleEntry(data);
                showToast("Schedule entry created.", "success");
            } else {
                await updateScheduleEntry(editingId, {
                    lessonID: data.lessonID,
                    dayOfWeek: data.dayOfWeek,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    position: data.position
                });
                showToast("Schedule entry updated.", "success");
            }

            closePanel();
            loadEntries();
        }
        catch (err) {
            console.error(err);
            const message = err?.response?.data?.message || "Operation failed.";
            showToast(message, "error");
        }
        finally {
            setSaving(false);
        }
    };

    const handleDelete = (entry) => {
        setConfirmState({
            title: `Delete this schedule entry?`,
            message: `${DAY_NAMES[entry.dayOfWeek]} ${entry.startTime}-${entry.endTime}: ${entry.lessonTitle}`,
            confirmLabel: "Delete",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteScheduleEntry(entry.scheduleEntryID);
                    showToast("Entry deleted.", "success");
                    loadEntries();
                }
                catch (err) { console.error(err);
                    showToast("Couldn't delete entry.", "error");
                }
            }
        });
    };

    // Weekly view grouping
    const grouped = DAY_NAMES.map((name, index) => ({
        day: index,
        name,
        entries: entries
            .filter(e => e.dayOfWeek === index)
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
    }));

    // Semester view data
    const semesterWeeks = useMemo(() => {
        const monday = getMonday(semesterStart);
        const weeks = [];
        for (let w = 0; w < SEMESTER_WEEKS; w++) {
            const weekStart = addDays(monday, w * 7);
            const weekEnd = addDays(weekStart, 6);
            const days = [];
            for (let d = 0; d < 7; d++) {
                const date = addDays(weekStart, d);
                days.push({
                    date,
                    dayOfWeek: d,
                    entries: entries
                        .filter(e => e.dayOfWeek === d)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                });
            }
            weeks.push({ weekStart, weekEnd, label: `W${w + 1}`, days });
        }
        return weeks;
    }, [entries, semesterStart]);

    const semesterEnd = useMemo(() => {
        if (semesterWeeks.length === 0) return semesterStart;
        return semesterWeeks[semesterWeeks.length - 1].weekEnd;
    }, [semesterWeeks, semesterStart]);

    const shiftSemester = (direction) => {
        const newStart = new Date(semesterStart);
        newStart.setDate(newStart.getDate() + direction * SEMESTER_WEEKS * 7);
        setSemesterStart(newStart);
    };

    const semesterDateRange = `${formatShort(semesterStart)} – ${formatShort(semesterEnd)}`;

    return (
        <div className="page">

            <div className="welcome-banner">
                <h2>Course Schedule</h2>
                <p>Weekly timetable for all courses</p>
            </div>

            <div className="page-header">
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                        className={`btn btn-sm ${viewMode === "weekly" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setViewMode("weekly")}
                    >
                        Weekly
                    </button>
                    <button
                        className={`btn btn-sm ${viewMode === "semester" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setViewMode("semester")}
                    >
                        Semester
                    </button>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    {viewMode === "semester" && (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <button className="btn btn-outline btn-sm" onClick={() => shiftSemester(-1)}>
                                &larr;
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", margin: "0 6px" }}>
                                {semesterDateRange}
                            </span>
                            <button className="btn btn-outline btn-sm" onClick={() => shiftSemester(1)}>
                                &rarr;
                            </button>
                        </div>
                    )}
                    <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        style={{
                            padding: "10px 14px",
                            border: "1.5px solid var(--border)",
                            borderRadius: "12px",
                            fontSize: "14px",
                            background: "var(--surface-alt)"
                        }}
                    >
                        <option value="">All Courses</option>
                        {courses.map(c => (
                            <option key={c.courseID} value={c.courseID}>
                                {c.title}
                            </option>
                        ))}
                    </select>
                    {canManage && (
                        <button className="btn btn-primary" onClick={openCreatePanel}>
                            + New Entry
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading schedule...
                </div>
            ) : entries.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📅</div>
                    <p>
                        {courseFilter
                            ? "No schedule entries for this course."
                            : "No schedule entries yet. Create one to get started."}
                    </p>
                </div>
            ) : viewMode === "weekly" ? (
                <div className="schedule-grid fade-in">
                    {grouped.map(day => (
                        <div key={day.day} className={`schedule-day ${day.entries.length > 0 ? "has-entries" : ""}`}>
                            <div className="schedule-day-header">
                                {day.name}
                                {day.entries.length > 0 && (
                                    <span className="schedule-count">{day.entries.length}</span>
                                )}
                            </div>
                            <div className="schedule-day-body">
                                {day.entries.length === 0 ? (
                                    <div className="schedule-empty">No classes</div>
                                ) : (
                                    day.entries.map(entry => (
                                        <div key={entry.scheduleEntryID} className="schedule-card" style={{ cursor: "pointer" }}
                                             onClick={() => navigate(`/materials?lessonId=${entry.lessonID}`)}>
                                            <div className="schedule-time">
                                                {entry.startTime} - {entry.endTime}
                                            </div>
                                            <div className="schedule-lesson">
                                                {entry.lessonTitle}
                                            </div>
                                            {canManage && (
                                                <div className="schedule-actions">
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => openEditPanel(entry)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(entry)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="schedule-semester fade-in">
                    <div className="semester-grid">
                        <div className="semester-header-row">
                            <div className="semester-cell semester-week-label"></div>
                            {DAY_SHORT.map((name, i) => (
                                <div key={i} className="semester-cell semester-day-header">{name}</div>
                            ))}
                        </div>
                        {semesterWeeks.map(week => (
                            <div key={week.weekStart.toISOString()} className="semester-week-row">
                                <div className="semester-cell semester-week-label">
                                    <span>{week.label}</span>
                                    <span className="semester-week-dates">
                                        {formatShort(week.weekStart)}
                                    </span>
                                </div>
                                {week.days.map(day => (
                                    <div key={day.date.toISOString()} className="semester-cell semester-day-cell">
                                        <div className="semester-date-label">{formatShort(day.date)}</div>
                                        {day.entries.length === 0 ? (
                                            <div className="semester-empty">-</div>
                                        ) : (
                                            day.entries.slice(0, 3).map(entry => (
                                                <div
                                                    key={entry.scheduleEntryID}
                                                    className="semester-entry-card"
                                                    onClick={() => navigate(`/materials?lessonId=${entry.lessonID}`)}
                                                    title={entry.lessonTitle}
                                                >
                                                    <span className="semester-entry-time">{entry.startTime}</span>
                                                    <span className="semester-entry-title">{entry.lessonTitle}</span>
                                                </div>
                                            ))
                                        )}
                                        {day.entries.length > 3 && (
                                            <div className="semester-more">+{day.entries.length - 3} more</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Add Schedule Entry" : "Edit Schedule Entry"}
                onClose={closePanel}
                wide
                footer={
                    <>
                        <button className="btn btn-outline" onClick={closePanel} disabled={saving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving && <span className="spinner" />}
                            {editingId == null
                                ? (saving ? "Adding..." : "Add Entry")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                {canManage && (
                    <div className="field" style={{ marginBottom: 16 }}>
                        <label>Course</label>
                        <select
                            name="courseID"
                            value={form.courseID}
                            onChange={handleChange}
                            disabled={editingId != null}
                        >
                            <option value="">Select Course</option>
                            {courses.map(c => (
                                <option key={c.courseID} value={c.courseID}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Lesson</label>
                    <select
                        name="lessonID"
                        value={form.lessonID}
                        onChange={handleChange}
                    >
                        <option value="">Select Lesson</option>
                        {filteredLessons.map(l => (
                            <option key={l.lessonID} value={l.lessonID}>
                                {l.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Day of Week</label>
                    <select
                        name="dayOfWeek"
                        value={form.dayOfWeek}
                        onChange={handleChange}
                    >
                        {DAY_NAMES.map((name, index) => (
                            <option key={index} value={index}>{name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    <div className="field">
                        <label>Start Time</label>
                        <input
                            type="time"
                            name="startTime"
                            value={form.startTime}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="field">
                        <label>End Time</label>
                        <input
                            type="time"
                            name="endTime"
                            value={form.endTime}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="field">
                    <label>Position (order)</label>
                    <input
                        type="number"
                        name="position"
                        value={form.position}
                        onChange={handleChange}
                        min="0"
                    />
                </div>
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            {toastEl}

        </div>
    );
}

export default Schedule;
