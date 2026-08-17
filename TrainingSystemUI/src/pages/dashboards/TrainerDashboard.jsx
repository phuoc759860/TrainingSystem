import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle, Target, ClipboardList, FileText, BarChart3, ArrowRight } from "lucide-react";
import { getTrainerDashboard } from "../../services/DashboardService";
import { getQuickAccess, getSidebarIcon } from "../../config/navigation";
import AnimatedNumber from "../../components/AnimatedNumber";

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

export default function TrainerDashboard() {
    const navigate = useNavigate();
    const { name } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getTrainerDashboard();
                setStats(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        })();
    }, []);

    const greeting = getGreeting();
    const today = formatTime();

    const statCards = [
        { key: "myCourses", label: "My Courses", gradient: "stat-card-purple", icon: BookOpen },
        { key: "myStudents", label: "My Students", gradient: "stat-card-blue", icon: BarChart3 },
        { key: "totalLessons", label: "Lessons", gradient: "stat-card-green", icon: BookOpen },
        { key: "totalExams", label: "Exams", gradient: "stat-card-coral", icon: CheckCircle },
        { key: "totalQuizzes", label: "Quizzes", gradient: "stat-card-yellow", icon: Target },
        { key: "pendingGrading", label: "Pending Grading", gradient: "stat-card-teal", icon: FileText },
        { key: "totalEnrollments", label: "Enrollments", gradient: "stat-card-blue", icon: ClipboardList },
        { key: "activeEnrollments", label: "Active", gradient: "stat-card-green", icon: BarChart3 },
    ];

    return (
        <div className="page">
            <div className="welcome-banner">
                <div>
                    <h2>{greeting}, {name || "Trainer"} 👋</h2>
                    <p>{today} &middot; Training Management Panel</p>
                </div>
                <span className="badge" style={{ fontSize: 13, padding: "6px 14px", background: "rgba(255,255,255,.2)", color: "#fff" }}>Trainer</span>
            </div>

            {loading ? (
                <div className="stat-grid">
                    {statCards.map((_, i) => (
                        <div key={i} className="stat-card stat-card-loading">
                            <div className="num" style={{ background: "rgba(255,255,255,.3)", width: 48, height: 24, borderRadius: 6 }}>&nbsp;</div>
                            <div className="label" style={{ background: "rgba(255,255,255,.3)", width: 80, height: 12, borderRadius: 4, marginTop: 8 }}>&nbsp;</div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="stat-grid">
                        {statCards.map((card, i) => {
                            const StatIcon = card.icon;
                            return (
                                <div key={card.key} className={`stat-card ${card.gradient}`} style={{ animationDelay: `${i * 60}ms` }}>
                                    <div className="stat-top">
                                        <div className="stat-value">
                                            <div className="num stat-card-num">
                                                <AnimatedNumber value={stats?.[card.key]} />
                                            </div>
                                        </div>
                                        <div className="stat-icon">
                                            <StatIcon size={20} />
                                        </div>
                                    </div>
                                    <div className="label stat-label">{card.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="dashboard-grid">
                        <div className="card">
                            <div className="card-header-row">
                                <h4 className="card-title">My Courses</h4>
                                <button className="btn btn-sm btn-primary" onClick={() => navigate("/courses")}>Manage</button>
                            </div>
                            {stats?.courses?.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {stats.courses.map((c, i) => (
                                        <div key={c.courseID} className="dashboard-row" style={{ cursor: "pointer", borderBottom: i < stats.courses.length - 1 ? "1px solid var(--border)" : "none" }} onClick={() => navigate("/courses")}>
                                            <div className="course-icon-sm"><BookOpen size={18} /></div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="course-row-title">{c.title}</div>
                                                <div className="course-row-meta">
                                                    {c.studentCount} students &middot; {c.lessonCount} lessons &middot; {c.examCount} exams
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="row-arrow" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state empty-state-text">
                                    <div className="empty-icon"><BookOpen size={28} /></div>
                                    <p>No courses yet. Create your first course!</p>
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header-row">
                                <h4 className="card-title">Pending Grading</h4>
                                {stats?.pendingGrading > 0 && (
                                    <button className="btn btn-sm btn-outline" onClick={() => navigate("/exam-results")}>Grade</button>
                                )}
                            </div>
                            {stats?.pendingGrades?.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {stats.pendingGrades.map((g, i) => (
                                        <div key={g.resultID} className="dashboard-row" style={{ cursor: "pointer", borderBottom: i < stats.pendingGrades.length - 1 ? "1px solid var(--border)" : "none" }} onClick={() => navigate(`/exam-results/${g.resultID}/grade`)}>
                                            <div className="pending-dot" />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{g.studentName}</div>
                                                <div className="pending-subtitle">{g.examTitle} &middot; {g.courseTitle}</div>
                                            </div>
                                            <span className="pending-date">{new Date(g.submittedAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state empty-state-text">
                                    <p>No pending grading items</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {stats?.upcomingSchedule?.length > 0 && (
                        <div className="card" style={{ marginBottom: 28 }}>
                            <h4 className="card-title" style={{ marginBottom: 14 }}>Upcoming Schedule</h4>
                            <div className="schedule-scroll">
                                {stats.upcomingSchedule.map((s) => (
                                    <div key={s.scheduleEntryID} className="schedule-mini-card">
                                        <div className="schedule-mini-day">{s.dayOfWeek}</div>
                                        <div className="schedule-mini-title">{s.lessonTitle}</div>
                                        <div className="schedule-mini-subtitle">{s.courseTitle}</div>
                                        <div className="schedule-mini-time">{s.startTime} - {s.endTime}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 8 }}>
                        <h3 className="dashboard-section-title">Training Modules</h3>
                        <div className="module-grid">
                            {getQuickAccess("Trainer").map((m, i) => {
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
