import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { BookOpen, BookMarked, CheckCircle, GraduationCap, BarChart3, ArrowRight } from "lucide-react";
import { getStudentDashboard } from "../../services/DashboardService";
import { getQuickAccess, getSidebarIcon } from "../../config/navigation";

function AnimatedNumber({ value, duration = 700 }) {
    const [display, setDisplay] = useState(0);
    const frameRef = useRef(null);
    const prevValue = useRef(value);

    useEffect(() => {
        if (value == null) return;
        const target = Number(value) || 0;
        const startTime = performance.now();
        const startValue = prevValue.current != null ? Number(prevValue.current) : 0;
        prevValue.current = target;

        const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(startValue + (target - startValue) * eased));
            if (progress < 1) frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [value, duration]);

    if (value == null) return <>&ndash;</>;
    return <>{display}</>;
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

function formatTime() {
    return new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
}

export default function StudentDashboard() {
    const navigate = useNavigate();
    const name = localStorage.getItem("name");
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getStudentDashboard();
                setStats(res.data);
            } catch { /* silent */ }
            finally { setLoading(false); }
        })();
    }, []);

    const greeting = getGreeting();
    const today = formatTime();

    return (
        <div className="page">
            <div className="welcome-banner">
                <div>
                    <h2>{greeting}, {name || "Student"} 👋</h2>
                    <p>{today} &middot; Learning Panel</p>
                </div>
                <span className="badge" style={{ fontSize: 13, padding: "6px 14px", background: "rgba(255,255,255,.2)", color: "#fff" }}>Student</span>
            </div>

            {loading ? (
                <div className="stat-grid">
                    {[1, 2, 3, 4].map((_, i) => (
                        <div key={i} className="stat-card stat-card-loading">
                            <div className="num" style={{ background: "rgba(255,255,255,.3)", width: 48, height: 24, borderRadius: 6 }}>&nbsp;</div>
                            <div className="label" style={{ background: "rgba(255,255,255,.3)", width: 80, height: 12, borderRadius: 4, marginTop: 8 }}>&nbsp;</div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="stat-grid">
                        <div className="stat-card stat-card-purple">
                            <div className="stat-top">
                                <div className="stat-value">
                                    <div className="num stat-card-num"><AnimatedNumber value={stats?.enrolledCourses} /></div>
                                </div>
                                <div className="stat-icon"><BookMarked size={20} /></div>
                            </div>
                            <div className="label stat-label">Enrolled Courses</div>
                        </div>
                        <div className="stat-card stat-card-green">
                            <div className="stat-top">
                                <div className="stat-value">
                                    <div className="num stat-card-num"><AnimatedNumber value={stats?.completedLessons} /></div>
                                    {stats?.totalLessons > 0 && (
                                        <span className="stat-total-span">/ {stats.totalLessons}</span>
                                    )}
                                </div>
                                <div className="stat-icon"><BookOpen size={20} /></div>
                            </div>
                            <div className="label stat-label">Lessons Completed</div>
                        </div>
                        <div className="stat-card stat-card-blue">
                            <div className="stat-top">
                                <div className="stat-value">
                                    <div className="num stat-card-num"><AnimatedNumber value={stats?.upcomingExams} /></div>
                                </div>
                                <div className="stat-icon"><CheckCircle size={20} /></div>
                            </div>
                            <div className="label stat-label">Upcoming Exams</div>
                        </div>
                        <div className="stat-card stat-card-teal">
                            <div className="stat-top">
                                <div className="stat-value">
                                    <div className="num stat-card-num" style={{ fontSize: 26 }}><AnimatedNumber value={stats?.overallProgress} />%</div>
                                </div>
                                <div className="stat-icon"><BarChart3 size={20} /></div>
                            </div>
                            <div className="label stat-label">Overall Progress</div>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        <div className="card">
                            <div className="card-header-row">
                                <h4 className="card-title">My Courses</h4>
                                <button className="btn btn-sm btn-primary" onClick={() => navigate("/my-learning")}>View All</button>
                            </div>
                            {stats?.courses?.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {stats.courses.map((c) => (
                                        <div key={c.courseID} style={{ cursor: "pointer" }} onClick={() => c.lastLessonID ? navigate(`/learn/${c.lastLessonID}`) : navigate(`/courses`)}>
                                            <div className="course-progress-header">
                                                <span className="course-progress-title">{c.title}</span>
                                                <span className="course-progress-pct">{c.progress}%</span>
                                            </div>
                                            <div className="progress-bar-track">
                                                <div className="progress-bar-fill" style={{ width: `${c.progress}%` }} />
                                            </div>
                                            <div className="course-progress-meta">
                                                {c.completedLessons}/{c.totalLessons} lessons &middot; {c.trainerName}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state empty-state-text">
                                    <div className="empty-icon"><BookMarked size={28} /></div>
                                    <p>Not enrolled in any courses yet</p>
                                    <button className="btn btn-sm btn-primary" style={{ marginTop: 10 }} onClick={() => navigate("/courses")}>Browse Courses</button>
                                </div>
                            )}
                        </div>

                        <div className="student-side-stack">
                            <div className="card">
                                <h4 className="card-title" style={{ marginBottom: 12 }}>Upcoming Exams</h4>
                                {stats?.upcomingExamsList?.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {stats.upcomingExamsList.map((e) => (
                                            <div key={e.examID} className="exam-row" onClick={() => navigate(`/exams/${e.examID}/take`)}>
                                                <GraduationCap size={18} style={{ opacity: .5 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="exam-row-title">{e.title}</div>
                                                    <div className="exam-row-course">{e.courseTitle}</div>
                                                </div>
                                                <span className="badge badge-success" style={{ fontSize: 10 }}>Pending</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state" style={{ padding: "16px 0" }}>
                                        <p>No upcoming exams</p>
                                    </div>
                                )}
                            </div>

                            <div className="card">
                                <h4 className="card-title" style={{ marginBottom: 12 }}>Recent Grades</h4>
                                {stats?.recentGrades?.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {stats.recentGrades.map((g) => (
                                            <div key={g.resultID} className="exam-row">
                                                <span style={{ fontSize: 16 }}>{g.passed ? "✅" : "❌"}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="exam-row-title">{g.examTitle}</div>
                                                    <div className="exam-row-course">{g.courseTitle}</div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: g.passed ? "var(--success)" : "var(--danger)" }}>{g.score}%</div>
                                                    <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>{new Date(g.submittedAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state" style={{ padding: "16px 0" }}>
                                        <p>No grades yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                        <h3 className="dashboard-section-title">Learning Modules</h3>
                        <div className="module-grid">
                            {getQuickAccess("Student").map((m, i) => {
                                const Icon = getSidebarIcon(m.key);
                                return (
                                    <button
                                        key={m.path}
                                        className="module-card"
                                        style={{ animationDelay: `${i * 40}ms`, borderLeft: `3px solid ${m.color}` }}
                                        onClick={() => navigate(m.path)}
                                    >
                                        <Icon size={20} style={{ flexShrink: 0, color: m.color }} />
                                        <div>
                                            <div className="module-card-label">{m.label}</div>
                                            <div className="module-card-desc">{m.desc}</div>
                                        </div>
                                        <ArrowRight size={16} className="arrow" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
