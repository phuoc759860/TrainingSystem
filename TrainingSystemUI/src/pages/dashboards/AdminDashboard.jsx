import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, BookOpen, CheckCircle, ClipboardList, KeyRound, ArrowRight } from "lucide-react";
import { getAdminDashboard } from "../../services/DashboardService";
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

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { name } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getAdminDashboard();
                setStats(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        })();
    }, []);

    const greeting = getGreeting();
    const today = formatTime();

    const statCards = [
        { key: "totalUsers", label: "Total Users", gradient: "stat-card-purple", icon: Users },
        { key: "totalCourses", label: "Courses", gradient: "stat-card-blue", icon: BookOpen },
        { key: "totalLessons", label: "Lessons", gradient: "stat-card-green", icon: BookOpen },
        { key: "totalExams", label: "Exams", gradient: "stat-card-coral", icon: CheckCircle },
        { key: "totalEnrollments", label: "Enrollments", gradient: "stat-card-yellow", icon: ClipboardList },
    ];

    return (
        <div className="page">
            <div className="welcome-banner">
                <div>
                    <h2>{greeting}, {name || "Admin"} 👋</h2>
                    <p>{today} &middot; System Administration Panel</p>
                </div>
                <span className="badge" style={{ fontSize: 13, padding: "6px 14px", background: "rgba(255,255,255,.2)", color: "#fff" }}>Admin</span>
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

                                    {stats && card.key === "totalUsers" && (
                                        <div className="stat-card-popup">
                                            <div className="stat-card-popup-arrow" />
                                            <div className="popup-title">Role Breakdown</div>
                                            <div className="popup-item">
                                                <span className="popup-icon">🔑</span>
                                                <span className="popup-label">Admins</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.adminCount} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">👨‍🏫</span>
                                                <span className="popup-label">Trainers</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.trainerCount} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">🎓</span>
                                                <span className="popup-label">Students</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.studentCount} /></span>
                                            </div>
                                        </div>
                                    )}

                                    {stats && card.key === "totalCourses" && (
                                        <div className="stat-card-popup">
                                            <div className="stat-card-popup-arrow" />
                                            <div className="popup-title">Course Overview</div>
                                            <div className="popup-item">
                                                <span className="popup-icon">📖</span>
                                                <span className="popup-label">Total Lessons</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalLessons} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">📋</span>
                                                <span className="popup-label">Enrollments</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalEnrollments} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">📎</span>
                                                <span className="popup-label">Materials</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalMaterials} /></span>
                                            </div>
                                        </div>
                                    )}

                                    {stats && card.key === "totalLessons" && (
                                        <div className="stat-card-popup">
                                            <div className="stat-card-popup-arrow" />
                                            <div className="popup-title">Content Stats</div>
                                            <div className="popup-item">
                                                <span className="popup-icon">📚</span>
                                                <span className="popup-label">Courses</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalCourses} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">📎</span>
                                                <span className="popup-label">Materials</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalMaterials} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">🎯</span>
                                                <span className="popup-label">Quizzes</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalQuizzes} /></span>
                                            </div>
                                        </div>
                                    )}

                                    {stats && card.key === "totalExams" && (
                                        <div className="stat-card-popup">
                                            <div className="stat-card-popup-arrow" />
                                            <div className="popup-title">Exam Performance</div>
                                            <div className="popup-item">
                                                <span className="popup-icon">📊</span>
                                                <span className="popup-label">Results Submitted</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalResults} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">✅</span>
                                                <span className="popup-label">Pass Rate</span>
                                                <span className={`popup-count ${stats.totalResults > 0 && stats.passedResults / stats.totalResults >= 0.5 ? "stat-card-popup-count-pass" : "stat-card-popup-count-fail"}`}>
                                                    {stats.totalResults > 0 ? Math.round(stats.passedResults / stats.totalResults * 100) + "%" : "—"}
                                                </span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">🎯</span>
                                                <span className="popup-label">Quizzes</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalQuizzes} /></span>
                                            </div>
                                        </div>
                                    )}

                                    {stats && card.key === "totalEnrollments" && (
                                        <div className="stat-card-popup">
                                            <div className="stat-card-popup-arrow" />
                                            <div className="popup-title">Enrollment Details</div>
                                            <div className="popup-item">
                                                <span className="popup-icon">✅</span>
                                                <span className="popup-label">Active Now</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.activeEnrollments} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">👥</span>
                                                <span className="popup-label">Total Users</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.totalUsers} /></span>
                                            </div>
                                            <div className="popup-item">
                                                <span className="popup-icon">🎓</span>
                                                <span className="popup-label">Students</span>
                                                <span className="popup-count"><AnimatedNumber value={stats.studentCount} /></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="dashboard-grid">
                        <div className="card">
                            <h4 className="card-title" style={{ marginBottom: 14 }}>Popular Courses</h4>
                            {stats?.popularCourses?.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {stats.popularCourses.map((c, i) => (
                                        <div key={c.courseID} className="dashboard-row" style={{ borderBottom: i < stats.popularCourses.length - 1 ? "1px solid var(--border)" : "none" }}>
                                            <span className="rank-icon">{i + 1}</span>
                                            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{c.title}</span>
                                            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{c.studentCount} students</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state empty-state-text"><p>No courses yet</p></div>
                            )}
                        </div>

                        <div className="card">
                            <h4 className="card-title" style={{ marginBottom: 14 }}>System Overview</h4>
                            <div className="overview-grid">
                                {[
                                    { label: "Materials", value: stats?.totalMaterials },
                                    { label: "Active Enrollments", value: stats?.activeEnrollments },
                                    { label: "Exam Results", value: stats?.totalResults },
                                    { label: "Pass Rate", value: stats?.totalResults > 0 ? Math.round(stats.passedResults / stats.totalResults * 100) + "%" : "—" },
                                    { label: "Quizzes", value: stats?.totalQuizzes },
                                    { label: "Forum Threads", value: stats?.totalForumThreads },
                                ].map((item, i) => (
                                    <div key={i} className="overview-item">
                                        <div className="overview-item-label">{item.label}</div>
                                        <div className="overview-item-value">{item.value ?? "—"}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                        <h3 className="dashboard-section-title">Administration Modules</h3>
                        <div className="module-grid">
                            {getQuickAccess("Admin").map((m, i) => {
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
