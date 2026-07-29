import { useEffect, useMemo, useState, useRef } from "react";
import {
    getAvailableCourses,
    getClassOverview,
    getStudentDetail,
    getExamRanking,
    getTrainers,
    getTrainerDetail
} from "../services/StatisticsService";
import useAuth from "../hooks/useAuth";
import { getStudentGrades, getCourseGrades } from "../services/GradeService";
import SidePanel from "../components/SidePanel";
import useToast from "../hooks/useToast";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList, PieChart, Pie, Sector
} from "recharts";

function cssVar(name, fallback) {
    if (typeof document === "undefined") return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
const SUCCESS = cssVar("--success", "#17a668");
const BRAND = cssVar("--brand", "#6c5ce7");
const BRAND_LIGHT = cssVar("--brand-light", "#8b7ffb");
const DANGER = cssVar("--danger", "#e34a4a");
const INK_SOFT = cssVar("--ink-soft", "#6b7089");

function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handler = (e) => setReduced(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return reduced;
}

// Horizontal gradients so bars read as lit from the left rather than flat fills.
function ScoreGradientDefs() {
    return (
        <defs>
            <linearGradient id="gradSuccess" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={SUCCESS} stopOpacity={0.75} />
                <stop offset="100%" stopColor={SUCCESS} />
            </linearGradient>
            <linearGradient id="gradBrand" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={BRAND_LIGHT} stopOpacity={0.8} />
                <stop offset="100%" stopColor={BRAND} />
            </linearGradient>
            <linearGradient id="gradDanger" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={DANGER} stopOpacity={0.75} />
                <stop offset="100%" stopColor={DANGER} />
            </linearGradient>
        </defs>
    );
}
function scoreFill(value) {
    if (value >= 70) return "url(#gradSuccess)";
    if (value >= 50) return "url(#gradBrand)";
    return "url(#gradDanger)";
}

function scoreColor(value) {
    if (value >= 70) return SUCCESS;
    if (value >= 50) return BRAND;
    return DANGER;
}

function scoreGrade(value) {
    if (value >= 90) return "A";
    if (value >= 80) return "B";
    if (value >= 70) return "C";
    if (value >= 60) return "D";
    return "F";
}
function scoreCardClass(value) {
    if (value >= 70) return "stat-card-green";
    if (value >= 50) return "stat-card-purple";
    return "stat-card-coral";
}

function truncate(str, max = 22) {
    if (!str) return "";
    return str.length > max ? `${str.slice(0, max)}…` : str;
}

function initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function sortRows(rows, key, dir) {
    if (!key) return rows;
    const sorted = [...rows].sort((a, b) => {
        const av = a[key], bv = b[key];
        if (typeof av === "string") return av.localeCompare(bv);
        return (av ?? 0) - (bv ?? 0);
    });
    return dir === "desc" ? sorted.reverse() : sorted;
}

function SortableTh({ label, sortKey, currentSort, onSort }) {
    const active = currentSort.key === sortKey;
    return (
        <th
            className={`sortable ${active ? "sorted" : ""}`}
            onClick={() => onSort(sortKey)}
        >
            {label}
            <span className="sort-arrow">
                {active ? (currentSort.dir === "asc" ? "▲" : "▼") : "↕"}
            </span>
        </th>
    );
}

function scoreFillClass(value) {
    if (value >= 70) return "fill-success";
    if (value >= 50) return "fill-brand";
    return "fill-danger";
}

function MiniBar({ value, max = 100, delay = 0 }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => setWidth(Math.max(0, Math.min(100, (value / max) * 100))), delay);
        return () => clearTimeout(timer);
    }, [value, max, delay]);

    return (
        <span className="mini-bar">
            <span
                className={`mini-bar-fill ${scoreFillClass(value)}`}
                style={{ width: `${width}%` }}
            />
        </span>
    );
}

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
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(tick);
            }
        };

        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [value, duration]);

    if (value == null) return <>–</>;
    return <>{display}</>;
}

function ChartCard({ title, subtitle, children, height = 300, delay = 0 }) {
    return (
        <div
            className="card chart-card fade-in"
            style={{
                marginBottom: 24,
                animationDelay: `${delay}ms`,
                animationFillMode: "both"
            }}
        >
            <h3 style={{ marginTop: 0, marginBottom: subtitle ? 4 : 16, fontSize: 17 }}>{title}</h3>
            {subtitle && (
                <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 0, marginBottom: 16 }}>
                    {subtitle}
                </p>
            )}
            <div style={{ width: "100%", height }}>
                {children}
            </div>
        </div>
    );
}

// Animated "growing bars" placeholder shown for ~1s while a chart's data loads
function ChartSkeleton({ rows = 5, height }) {
    const widths = useMemo(
        () => Array.from({ length: rows }, () => 30 + Math.random() * 60),
        [rows]
    );
    return (
        <div className="chart-skeleton" style={{ height }}>
            {widths.map((w, i) => (
                <div className="chart-skeleton-row" key={i}>
                    <span className="chart-skeleton-label" />
                    <span className="chart-skeleton-bar-track">
                        <span
                            className="chart-skeleton-bar-fill"
                            style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
                        />
                    </span>
                </div>
            ))}
        </div>
    );
}

function CustomTooltip({ active, payload, label, unit = "%" }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="chart-tooltip">
            {label && <div className="chart-tooltip-label">{label}</div>}
            {payload.map((p, i) => (
                <div key={i} className="chart-tooltip-row">
                    <span className="chart-tooltip-dot" style={{ background: p.color || p.payload?.fill || "var(--brand)" }} />
                    <span>{p.name}</span>
                    <span className="chart-tooltip-value">{p.value}{unit}</span>
                </div>
            ))}
        </div>
    );
}

function EmptyPrompt({ icon, text }) {
    return (
        <div className="card empty-state">
            <div className="empty-icon">{icon}</div>
            <p>{text}</p>
        </div>
    );
}

function CourseSelect({ courses, value, onChange, placeholder = "Select a course..." }) {
    return (
        <div className="field" style={{ maxWidth: 320, marginBottom: 24 }}>
            <label>Course</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="">{placeholder}</option>
                {courses.map(c => (
                    <option key={c.courseID} value={c.courseID}>{c.title}</option>
                ))}
            </select>
        </div>
    );
}

function KpiRow({ items }) {
    const defaults = ["stat-card-purple", "stat-card-blue", "stat-card-green", "stat-card-yellow"];
    return (
        <div className="stat-grid">
            {items.map((item, i) => (
                <div className={`stat-card ${item.cardClass || defaults[i % defaults.length]}`} key={i}>
                    <div className="num" style={item.color ? { color: "#fff" } : undefined}>
                        {typeof item.value === "number" ? <AnimatedNumber value={item.value} /> : item.value}
                    </div>
                    <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>{item.label}</div>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ examsTaken, needsAttention }) {
    if (examsTaken === 0) return <span className="badge">No attempts</span>;
    if (needsAttention) return <span className={`badge badge-danger ${needsAttention ? "badge-pulse" : ""}`}>Needs Attention</span>;
    return <span className="badge badge-success">On Track</span>;
}

function renderActivePieShape(props) {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
        <g>
            <Sector
                cx={cx} cy={cy}
                innerRadius={innerRadius - 2}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,.2))", transition: "all .2s ease" }}
            />
            <Sector
                cx={cx} cy={cy}
                innerRadius={outerRadius + 12}
                outerRadius={outerRadius + 15}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                opacity={0.5}
            />
        </g>
    );
}

const TABS = [
    { key: "class", label: "Class" },
    { key: "students", label: "Students" },
    { key: "exams", label: "Exam Ranking" },
    { key: "grades", label: "Grades" }
];

const ADMIN_TABS = [
    ...TABS,
    { key: "trainers", label: "Trainers" }
];

function generateAiReport(detail, type = "student") {
    if (type === "trainer") return generateTrainerAiReport(detail);

    if (!detail || detail.examsTaken === 0) {
        return {
            summary: `${detail?.name || "This student"} has not taken any exams yet. No performance data is available for analysis.`,
            level: "neutral",
            sections: [
                { title: "Engagement", icon: "📋", text: "No exam submissions recorded. Consider reaching out to encourage participation in upcoming assessments." },
                { title: "Recommendation", icon: "💡", text: "Schedule a one-on-one meeting to understand any barriers to participation and provide support." }
            ]
        };
    }

    const avg = detail.averageScore;
    const pass = detail.passRate;
    const mcAcc = detail.multipleChoiceAccuracy;
    const essayAvg = detail.essayAverageScore;
    const courses = detail.courseBreakdown || [];
    const strongCourses = courses.filter(c => c.averageScore >= 70);
    const midCourses = courses.filter(c => c.averageScore >= 50 && c.averageScore < 70);
    const weakCourses = courses.filter(c => c.averageScore < 50);
    const strongExams = detail.strongestExams || [];
    const weakExams = detail.weakestExams || [];

    let level, levelLabel;
    if (avg >= 80) { level = "excellent"; levelLabel = "Excellent Performance"; }
    else if (avg >= 65) { level = "good"; levelLabel = "Good Performance"; }
    else if (avg >= 50) { level = "average"; levelLabel = "Average Performance"; }
    else { level = "needs-attention"; levelLabel = "Needs Attention"; }

    const sections = [];

    // Performance Summary
    let summaryParts = [];
    summaryParts.push(`${detail.name} has taken ${detail.examsTaken} exam(s) across ${courses.length} course(s) with an overall average of ${avg}% and a pass rate of ${pass}%.`);
    if (level === "excellent") summaryParts.push("This student is performing at an excellent level and consistently meeting or exceeding expectations.");
    else if (level === "good") summaryParts.push("This student is performing well with room for growth.");
    else if (level === "average") summaryParts.push("This student is performing at an average level and would benefit from targeted support.");
    else summaryParts.push("This student is struggling and requires immediate attention and intervention.");

    sections.push({
        title: "Performance Summary",
        icon: "📊",
        text: summaryParts.join(" "),
        metrics: [
            { label: "Average Score", value: `${avg}%`, color: avg >= 70 ? "var(--success)" : avg >= 50 ? "var(--brand)" : "var(--danger)" },
            { label: "Pass Rate", value: `${pass}%`, color: pass >= 70 ? "var(--success)" : pass >= 50 ? "var(--brand)" : "var(--danger)" },
            { label: "Exams Taken", value: detail.examsTaken, color: "var(--ink)" }
        ]
    });

    // Course-Level Advantages (detailed)
    if (courses.length > 0) {
        let courseText = [];

        if (strongCourses.length > 0) {
            courseText.push(`Advantages: ${strongCourses.map(c => `${c.courseTitle} (${c.averageScore}%, ${c.examsTaken} exam(s))`).join(", ")}. These courses show strong understanding and mastery of the material.`);
        }

        if (midCourses.length > 0) {
            courseText.push(`Moderate: ${midCourses.map(c => `${c.courseTitle} (${c.averageScore}%)`).join(", ")}. Decent performance but room for improvement with targeted practice.`);
        }

        if (weakCourses.length > 0) {
            courseText.push(`Weaknesses: ${weakCourses.map(c => `${c.courseTitle} (${c.averageScore}%)`).join(", ")}. These courses need focused attention — consider supplementary review, tutoring, or additional practice materials.`);
        }

        sections.push({
            title: "Course-Level Analysis",
            icon: "📚",
            text: courseText.join(" "),
            accent: weakCourses.length > 0 ? "danger" : strongCourses.length > 0 ? "success" : undefined,
            metrics: courses.length <= 5 ? courses.map(c => ({
                label: c.courseTitle,
                value: `${c.averageScore}%`,
                color: c.averageScore >= 70 ? "var(--success)" : c.averageScore >= 50 ? "var(--brand)" : "var(--danger)"
            })) : null
        });
    }

    // Skill Analysis
    if (mcAcc != null || essayAvg != null) {
        let skillText = [];
        if (mcAcc != null) {
            if (mcAcc >= 75) skillText.push(`Multiple choice accuracy is strong at ${mcAcc}%, showing solid factual knowledge.`);
            else if (mcAcc >= 50) skillText.push(`Multiple choice accuracy is moderate at ${mcAcc}%. There is room to strengthen foundational knowledge.`);
            else skillText.push(`Multiple choice accuracy is low at ${mcAcc}%. This suggests gaps in core concepts that need addressing.`);
        }
        if (essayAvg != null) {
            if (essayAvg >= 70) skillText.push(`Essay performance is strong at ${essayAvg}%, demonstrating good analytical and writing skills.`);
            else if (essayAvg >= 50) skillText.push(`Essay performance is moderate at ${essayAvg}%. Focus on structured reasoning and deeper analysis.`);
            else skillText.push(`Essay performance is low at ${essayAvg}%. Emphasize critical thinking and written communication practice.`);
        }

        sections.push({
            title: "Skill Analysis",
            icon: "🎯",
            text: skillText.join(" "),
            metrics: mcAcc != null && essayAvg != null ? [
                { label: "MC Accuracy", value: `${mcAcc}%`, color: mcAcc >= 70 ? "var(--success)" : "var(--danger)" },
                { label: "Essay Score", value: `${essayAvg}%`, color: essayAvg >= 70 ? "var(--success)" : "var(--danger)" }
            ] : null
        });
    }

    // Strengths
    if (strongCourses.length > 0 || strongExams.length > 0) {
        let strengthText = [];
        if (strongCourses.length > 0) {
            strengthText.push(`Strongest courses: ${strongCourses.map(c => `${c.courseTitle} (${c.averageScore}%)`).join(", ")}.`);
        }
        if (strongExams.length > 0) {
            strengthText.push(`Top exams: ${strongExams.slice(0, 2).map(e => `${e.examTitle} (${e.score}%)`).join(", ")}.`);
        }
        strengthText.push("These areas represent the student's core strengths. Consider assigning advanced challenges or peer mentoring roles to maintain engagement.");

        sections.push({
            title: "Strengths",
            icon: "💪",
            text: strengthText.join(" "),
            accent: "success"
        });
    }

    // Weaknesses
    if (weakCourses.length > 0 || weakExams.length > 0) {
        let weakText = [];
        if (weakCourses.length > 0) {
            weakText.push(`Needs improvement in: ${weakCourses.map(c => `${c.courseTitle} (${c.averageScore}%)`).join(", ")}.`);
        }
        if (weakExams.length > 0) {
            weakText.push(`Lowest exams: ${weakExams.slice(0, 2).map(e => `${e.examTitle} (${e.score}%)`).join(", ")}.`);
        }

        sections.push({
            title: "Areas for Improvement",
            icon: "⚠️",
            text: weakText.join(" "),
            accent: "danger"
        });
    }

    // Recommendations
    let recommendations = [];
    if (avg < 50) {
        recommendations.push("Schedule immediate intervention: arrange supplementary tutoring or review sessions.");
        recommendations.push("Break down complex topics into smaller, manageable study units with frequent check-ins.");
    } else if (avg < 70) {
        recommendations.push("Provide targeted practice materials focusing on weak areas identified above.");
        recommendations.push("Pair with a peer tutor or assign study groups for collaborative learning.");
    } else {
        recommendations.push("Assign advanced or enrichment materials to keep the student challenged and engaged.");
        recommendations.push("Consider leadership or mentoring opportunities to reinforce learning through teaching.");
    }

    if (mcAcc != null && essayAvg != null && Math.abs(mcAcc - essayAvg) > 20) {
        if (mcAcc > essayAvg) {
            recommendations.push("The student excels at factual recall but struggles with analytical writing. Assign more essay practice and provide writing rubrics.");
        } else {
            recommendations.push("The student writes well but struggles with factual recall. Focus on review quizzes and spaced repetition techniques.");
        }
    }

    if (weakCourses.length > 0) {
        recommendations.push(`Focus extra attention on ${weakCourses.map(c => c.courseTitle).join(" and ")} — consider review sessions, practice tests, or one-on-one support.`);
    }

    if (detail.needsAttention) {
        recommendations.push("This student needs attention — consider reaching out directly to discuss their progress and any obstacles.");
    }

    sections.push({
        title: "Recommendations",
        icon: "💡",
        items: recommendations
    });

    return { summary: summaryParts.join(" "), level, levelLabel, sections };
}

function generateTrainerAiReport(detail) {
    if (!detail) {
        return {
            summary: "No data available for this trainer.",
            level: "neutral",
            sections: [{ title: "No Data", icon: "📋", text: "No performance data available yet." }]
        };
    }

    const avg = detail.averageScore;
    const pass = detail.passRate;
    const courses = detail.courses || [];
    const coursesWithExams = courses.filter(c => c.examsTaken > 0);
    const coursesNoExams = courses.filter(c => c.examsTaken === 0);
    const strongCourses = coursesWithExams.filter(c => c.averageScore >= 70);
    const weakCourses = coursesWithExams.filter(c => c.averageScore < 50);

    let level, levelLabel;
    if (coursesWithExams.length === 0) { level = "neutral"; levelLabel = "No Exam Data"; }
    else if (avg >= 70 && pass >= 75) { level = "excellent"; levelLabel = "Excellent Teaching"; }
    else if (avg >= 60 && pass >= 60) { level = "good"; levelLabel = "Good Teaching"; }
    else if (avg >= 50) { level = "average"; levelLabel = "Average Results"; }
    else { level = "needs-attention"; levelLabel = "Needs Attention"; }

    const sections = [];

    let summaryParts = [];
    summaryParts.push(`${detail.name} manages ${detail.coursesCount} course(s) with ${detail.totalStudents} total enrolled student(s) and ${detail.totalExams} exam submission(s) across all courses.`);
    if (coursesWithExams.length > 0) {
        summaryParts.push(`Student performance across their courses averages ${avg}% with a ${pass}% pass rate.`);
    }
    if (coursesNoExams.length > 0) {
        summaryParts.push(`${coursesNoExams.length} course(s) have no exam submissions yet.`);
    }

    sections.push({
        title: "Trainer Overview",
        icon: "📊",
        text: summaryParts.join(" "),
        metrics: [
            { label: "Courses", value: detail.coursesCount, color: "var(--brand)" },
            { label: "Students", value: detail.totalStudents, color: "var(--ink)" },
            { label: "Avg Score", value: `${avg}%`, color: avg >= 60 ? "var(--success)" : "var(--danger)" },
            { label: "Pass Rate", value: `${pass}%`, color: pass >= 60 ? "var(--success)" : "var(--danger)" }
        ]
    });

    if (courses.length > 0) {
        let courseAnalysis = [];

        if (strongCourses.length > 0) {
            courseAnalysis.push(`Well-performing courses: ${strongCourses.map(c => `${c.courseTitle} (avg ${c.averageScore}%, ${c.enrolledStudents} students)`).join(", ")}.`);
        }

        if (weakCourses.length > 0) {
            courseAnalysis.push(`Courses needing attention: ${weakCourses.map(c => `${c.courseTitle} (avg ${c.averageScore}%)`).join(", ")}. Students are struggling — consider reviewing exam difficulty, content coverage, or providing additional resources.`);
        }

        if (coursesNoExams.length > 0) {
            courseAnalysis.push(`Courses without exam data: ${coursesNoExams.map(c => c.courseTitle).join(", ")}.`);
        }

        if (coursesWithExams.length > 0 && courseAnalysis.length === 0) {
            courseAnalysis.push("All courses have moderate student performance. Consider diversifying assessment methods or adjusting difficulty levels.");
        }

        sections.push({
            title: "Course Analysis",
            icon: "📚",
            text: courseAnalysis.join(" "),
            accent: weakCourses.length > 0 ? "danger" : strongCourses.length > 0 ? "success" : undefined,
            metrics: courses.length <= 6 ? courses.map(c => ({
                label: c.courseTitle,
                value: c.examsTaken > 0 ? `${c.averageScore}%` : "—",
                color: c.examsTaken === 0 ? "var(--ink-soft)" : c.averageScore >= 70 ? "var(--success)" : c.averageScore >= 50 ? "var(--brand)" : "var(--danger)"
            })) : null
        });
    }

    let recommendations = [];

    if (coursesWithExams.length === 0) {
        recommendations.push("No exams have been graded yet. Ensure exams are properly set up and students are completing them.");
    } else {
        if (avg >= 70 && pass >= 75) {
            recommendations.push("Strong overall performance. Consider introducing more challenging assessments to maintain academic rigor.");
        } else if (avg < 50) {
            recommendations.push("Average student scores are low across courses. Review exam difficulty, content alignment, and consider adding review materials or practice tests.");
        } else {
            recommendations.push("Provide additional support materials for underperforming courses identified above.");
        }

        if (weakCourses.length > 0) {
            recommendations.push(`Focus on improving outcomes in: ${weakCourses.map(c => c.courseTitle).join(" and ")}. Consider peer reviews, content revisions, or supplementary resources.`);
        }

        if (detail.totalStudents < 5) {
            recommendations.push("Total enrollment is low. Consider coordinating with administration to boost enrollment or visibility of your courses.");
        }
    }

    sections.push({
        title: "Recommendations",
        icon: "💡",
        items: recommendations
    });

    return { summary: summaryParts.join(" "), level, levelLabel, sections };
}

function Statistics() {
    const { role } = useAuth();
    const reducedMotion = usePrefersReducedMotion();
    const isAdmin = role === "Admin";

    const [activeTab, setActiveTab] = useState("class");
    const [courses, setCourses] = useState([]);
    const { showToast, toastEl } = useToast();

    // ---------- shared: student detail panel ----------
    const [panelOpen, setPanelOpen] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [aiReport, setAiReport] = useState(null);
    const [aiReportLoading, setAiReportLoading] = useState(false);

    const openStudent = async (userId) => {
        setPanelOpen(true);
        setPanelType("student");
        setDetailLoading(true);
        setDetail(null);
        setAiReport(null);
        try {
            const res = await getStudentDetail(userId);
            setDetail(res.data);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load student details.", "error");
            setPanelOpen(false);
        }
        finally {
            setDetailLoading(false);
        }
    };

    const closePanel = () => {
        setPanelOpen(false);
        setDetail(null);
        setAiReport(null);
    };

    const generateReport = async () => {
        if (!detail) return;
        setAiReportLoading(true);
        // Simulate AI processing delay for UX
        await new Promise(r => setTimeout(r, 800));
        const report = generateAiReport(detail, panelType);
        setAiReport(report);
        setAiReportLoading(false);
    };

    // ---------- CLASS tab ----------
    const [classCourseId, setClassCourseId] = useState("");
    const [classStudents, setClassStudents] = useState([]);
    const [classLoading, setClassLoading] = useState(false);
    const [classSort, setClassSort] = useState({ key: "averageScore", dir: "asc" });
    const [classAttentionOnly, setClassAttentionOnly] = useState(false);

    // ---------- STUDENTS tab ----------
    const [studentSearch, setStudentSearch] = useState("");
    const [allStudents, setAllStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentSort, setStudentSort] = useState({ key: "averageScore", dir: "asc" });
    const [studentAttentionOnly, setStudentAttentionOnly] = useState(false);

    // ---------- EXAMS tab ----------
    const [examCourseId, setExamCourseId] = useState("");
    const [examRanking, setExamRanking] = useState([]);
    const [examLoading, setExamLoading] = useState(false);

    // ---------- GRADES tab ----------
    const [gradesCourseId, setGradesCourseId] = useState("");
    const [gradesData, setGradesData] = useState([]);
    const [gradesLoading, setGradesLoading] = useState(false);
    const [gradesSort, setGradesSort] = useState({ key: "finalGrade", dir: "desc" });

    // ---------- TRAINERS tab ----------
    const [allTrainers, setAllTrainers] = useState([]);
    const [trainersLoading, setTrainersLoading] = useState(true);
    const [trainerSearch, setTrainerSearch] = useState("");
    const [trainerSort, setTrainerSort] = useState({ key: "averageScore", dir: "desc" });
    const [panelType, setPanelType] = useState("student");

    useEffect(() => {
        loadCourses();
        loadAllStudents();
    }, []);

    useEffect(() => {
        if (classCourseId) loadClassOverview();
        else setClassStudents([]);
    }, [classCourseId]);

    useEffect(() => {
        if (examCourseId) loadExamRanking();
        else setExamRanking([]);
    }, [examCourseId]);

    useEffect(() => {
        if (gradesCourseId) loadGrades();
        else setGradesData([]);
    }, [gradesCourseId]);

    useEffect(() => {
        if (activeTab === "trainers" && isAdmin && allTrainers.length === 0) loadAllTrainers();
    }, [activeTab]);

    const loadCourses = async () => {
        try {
            const res = await getAvailableCourses();
            setCourses(res.data);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load courses.", "error");
        }
    };

    const loadAllStudents = async () => {
        setStudentsLoading(true);
        try {
            const res = await getClassOverview();
            setAllStudents(res.data);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load students.", "error");
        }
        finally {
            setStudentsLoading(false);
        }
    };

    const loadAllTrainers = async () => {
        setTrainersLoading(true);
        try {
            const res = await getTrainers();
            setAllTrainers(res.data);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load trainers.", "error");
        }
        finally {
            setTrainersLoading(false);
        }
    };

    const openTrainer = async (userId) => {
        setPanelOpen(true);
        setPanelType("trainer");
        setDetailLoading(true);
        setDetail(null);
        setAiReport(null);
        try {
            const res = await getTrainerDetail(userId);
            setDetail(res.data);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load trainer details.", "error");
            setPanelOpen(false);
        }
        finally {
            setDetailLoading(false);
        }
    };

    const loadClassOverview = async () => {
        setClassLoading(true);
        try {
            const res = await getClassOverview(classCourseId);
            setClassStudents(res.data);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load class statistics.", "error");
        }
        finally {
            setClassLoading(false);
        }
    };

    const loadExamRanking = async () => {
        setExamLoading(true);
        try {
            const res = await getExamRanking(examCourseId);
            setExamRanking(res.data);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load exam ranking.", "error");
        }
        finally {
            setExamLoading(false);
        }
    };

    const loadGrades = async () => {
        setGradesLoading(true);
        try {
            const res = await getCourseGrades(gradesCourseId);
            setGradesData(res.data);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load grades.", "error");
        }
        finally {
            setGradesLoading(false);
        }
    };

    const toggleSort = (setSort) => (key) => {
        setSort(prev => prev.key === key
            ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
            : { key, dir: "asc" });
    };

    // ---------- CLASS derived ----------
    const classFiltered = useMemo(() => {
        let rows = classAttentionOnly ? classStudents.filter(s => s.needsAttention) : classStudents;
        return sortRows(rows, classSort.key, classSort.dir);
    }, [classStudents, classSort, classAttentionOnly]);

    const classChartData = [...classStudents]
        .filter(s => s.examsTaken > 0)
        .sort((a, b) => a.averageScore - b.averageScore)
        .map(s => ({ name: truncate(s.name, 14), fullName: s.name, score: s.averageScore }));

    const classKpis = useMemo(() => {
        const active = classStudents.filter(s => s.examsTaken > 0);
        const avg = active.length
            ? Math.round((active.reduce((sum, s) => sum + s.averageScore, 0) / active.length) * 10) / 10
            : null;
        const attention = classStudents.filter(s => s.needsAttention).length;
        return [
            { label: "Enrolled Students", value: classStudents.length },
            { label: "Class Average", value: avg != null ? `${avg}%` : "—", color: avg != null ? scoreColor(avg) : undefined, cardClass: avg != null ? scoreCardClass(avg) : undefined },
            { label: "Needs Attention", value: attention, color: attention > 0 ? DANGER : SUCCESS }
        ];
    }, [classStudents]);

    const passFailData = useMemo(() => {
        const active = classStudents.filter(s => s.examsTaken > 0);
        const passing = active.filter(s => !s.needsAttention).length;
        const attention = active.length - passing;
        if (active.length === 0) return [];
        return [
            { name: "On Track", value: passing, fill: SUCCESS },
            { name: "Needs Attention", value: attention, fill: DANGER }
        ];
    }, [classStudents]);

    // ---------- STUDENTS derived ----------
    const filteredStudents = useMemo(() => {
        let rows = studentSearch.trim()
            ? allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.trim().toLowerCase()))
            : allStudents;
        if (studentAttentionOnly) rows = rows.filter(s => s.needsAttention);
        return sortRows(rows, studentSort.key, studentSort.dir);
    }, [allStudents, studentSearch, studentSort, studentAttentionOnly]);

    const studentKpis = useMemo(() => {
        const active = allStudents.filter(s => s.examsTaken > 0);
        const avg = active.length
            ? Math.round((active.reduce((sum, s) => sum + s.averageScore, 0) / active.length) * 10) / 10
            : null;
        const attention = allStudents.filter(s => s.needsAttention).length;
        return [
            { label: "Total Students", value: allStudents.length },
            { label: "Overall Average", value: avg != null ? `${avg}%` : "—", color: avg != null ? scoreColor(avg) : undefined, cardClass: avg != null ? scoreCardClass(avg) : undefined },
            { label: "Needs Attention", value: attention, color: attention > 0 ? DANGER : SUCCESS }
        ];
    }, [allStudents]);

    // ---------- EXAMS derived ----------
    const examChartData = examRanking.map((e, i) => ({
        name: truncate(e.examTitle, 26),
        fullName: e.examTitle,
        rank: i + 1,
        score: e.averageScore
    }));

    const examKpis = useMemo(() => {
        if (examRanking.length === 0) return [];
        const top = examRanking[0];
        const bottom = examRanking[examRanking.length - 1];
        return [
            { label: "Exams Ranked", value: examRanking.length },
            { label: "Top Score", value: `${top.averageScore}%`, color: SUCCESS },
            { label: "Lowest Score", value: `${bottom.averageScore}%`, color: bottom.averageScore < 50 ? DANGER : undefined }
        ];
    }, [examRanking]);

    // ---------- TRAINERS derived ----------
    const filteredTrainers = useMemo(() => {
        let rows = trainerSearch.trim()
            ? allTrainers.filter(t => t.name.toLowerCase().includes(trainerSearch.trim().toLowerCase()) || t.email.toLowerCase().includes(trainerSearch.trim().toLowerCase()))
            : allTrainers;
        return sortRows(rows, trainerSort.key, trainerSort.dir);
    }, [allTrainers, trainerSearch, trainerSort]);

    const trainerKpis = useMemo(() => {
        if (allTrainers.length === 0) return [];
        const active = allTrainers.filter(t => t.totalExams > 0);
        const avg = active.length
            ? Math.round((active.reduce((sum, t) => sum + t.averageScore, 0) / active.length) * 10) / 10
            : null;
        const totalStudents = allTrainers.reduce((sum, t) => sum + t.totalStudents, 0);
        return [
            { label: "Total Trainers", value: allTrainers.length },
            { label: "Total Students", value: totalStudents, color: "var(--ink)" },
            { label: "Avg Student Score", value: avg != null ? `${avg}%` : "—", color: avg != null ? scoreColor(avg) : undefined, cardClass: avg != null ? scoreCardClass(avg) : undefined }
        ];
    }, [allTrainers]);

    const courseBreakdownData = detail?.courseBreakdown?.map(c => ({
        name: truncate(c.courseTitle, 16),
        fullName: c.courseTitle,
        score: c.averageScore
    })) ?? [];

    const trainerCourseData = (panelType === "trainer" && detail?.courses)
        ? [...detail.courses]
            .sort((a, b) => a.averageScore - b.averageScore)
            .map(c => ({
                name: truncate(c.courseTitle, 22),
                fullName: c.courseTitle,
                score: c.averageScore,
                students: c.enrolledStudents,
                exams: c.examsTaken
            }))
        : [];

    const skillTypeData = detail
        ? [
              detail.multipleChoiceAccuracy != null && { name: "Multiple Choice", score: detail.multipleChoiceAccuracy },
              detail.essayAverageScore != null && { name: "Essay", score: detail.essayAverageScore }
          ].filter(Boolean)
        : [];

    const rankMedal = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`);

    return (
        <div className="page">

            <div className="welcome-banner">
                <h2>Performance Statistics</h2>
                <p>Analyze student performance and identify areas for improvement</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Statistics</h2>
                </div>
            </div>

            {/* ---- Segmented tab bar ---- */}
            <div className="tabs-segment">
                {(isAdmin ? ADMIN_TABS : TABS).map(t => (
                    <button
                        key={t.key}
                        className={activeTab === t.key ? "active" : ""}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ================= CLASS TAB ================= */}
            {activeTab === "class" && (
                <div className="tab-content" key="class">
                    <CourseSelect
                        courses={courses}
                        value={classCourseId}
                        onChange={setClassCourseId}
                        placeholder="Select a course to see its class statistics..."
                    />

                    {!classCourseId ? (
                        <EmptyPrompt icon="🏫" text="Select a course above to view its class statistics." />
                    ) : classLoading ? (
                        <ChartCard title="Class Score Distribution" height={260}>
                            <ChartSkeleton rows={6} height={220} />
                        </ChartCard>
                    ) : classStudents.length === 0 ? (
                        <EmptyPrompt icon="📈" text="No enrolled students in this course yet." />
                    ) : (
                        <>
                            <KpiRow items={classKpis} />

                            {(classChartData.length > 0 || passFailData.length > 0) && (
                                <div style={{ display: "grid", gridTemplateColumns: passFailData.length ? "2fr 1fr" : "1fr", gap: 24 }}>
                                    {classChartData.length > 0 && (
                                        <ChartCard
                                            title="Class Score Distribution"
                                            subtitle="Average score per student, lowest to highest"
                                            height={Math.max(220, classChartData.length * 34)}
                                            delay={50}
                                        >
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={classChartData} key={classCourseId} layout="vertical" barCategoryGap="18%" barSize={20} margin={{ top: 4, right: 30, left: 8, bottom: 4 }}>
                                                    <ScoreGradientDefs />
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: INK_SOFT }} />
                                                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: INK_SOFT }} />
                                                    <Tooltip content={<CustomTooltip />} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} cursor={{ fill: "rgba(108,92,231,.06)" }} />
                                                    <Bar dataKey="score" name="Average Score" radius={[0, 6, 6, 0]}
                                                        isAnimationActive={!reducedMotion}
                                                        animationBegin={150}
                                                        animationDuration={1400}
                                                        animationEasing="ease-out"
                                                    >
                                                        {classChartData.map((entry, i) => (
                                                            <Cell key={i} fill={scoreFill(entry.score)} />
                                                        ))}
                                                        <LabelList dataKey="score" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 12, fill: "var(--ink)" }} />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    )}

                                    {passFailData.length > 0 && (
                                        <ChartCard title="On Track vs Needs Attention" height={Math.max(220, classChartData.length * 34)} delay={150}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart key={classCourseId}>
                                                    <Tooltip content={<CustomTooltip unit=" students" />} />
                                                    <Pie
                                                        data={passFailData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        innerRadius="60%"
                                                        outerRadius="85%"
                                                        paddingAngle={3}
                                                        activeShape={renderActivePieShape}
                                                        isAnimationActive={!reducedMotion}
                                                        animationBegin={350}
                                                        animationDuration={1400}
                                                        animationEasing="ease-out"
                                                    >
                                                        {passFailData.map((entry, i) => (
                                                            <Cell key={i} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: -8, fontSize: 12.5, color: "var(--ink-soft)" }}>
                                                <span><span style={{ color: SUCCESS }}>●</span> On Track</span>
                                                <span><span style={{ color: DANGER }}>●</span> Needs Attention</span>
                                            </div>
                                        </ChartCard>
                                    )}
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                                <button
                                    className={`chip-toggle ${classAttentionOnly ? "active" : ""}`}
                                    onClick={() => setClassAttentionOnly(v => !v)}
                                >
                                    ⚠ Needs Attention only
                                </button>
                            </div>

                            <table className="table-modern fade-in">
                                <thead>
                                    <tr>
                                        <SortableTh label="Student" sortKey="name" currentSort={classSort} onSort={toggleSort(setClassSort)} />
                                        <SortableTh label="Exams Taken" sortKey="examsTaken" currentSort={classSort} onSort={toggleSort(setClassSort)} />
                                        <SortableTh label="Average Score" sortKey="averageScore" currentSort={classSort} onSort={toggleSort(setClassSort)} />
                                        <SortableTh label="Pass Rate" sortKey="passRate" currentSort={classSort} onSort={toggleSort(setClassSort)} />
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classFiltered.map((s, i) => (
                                        <tr
                                            key={s.userID}
                                            className={s.examsTaken > 0 ? "clickable-row" : ""}
                                            onClick={() => s.examsTaken > 0 && openStudent(s.userID)}
                                            style={{ animationDelay: `${i * 20}ms` }}
                                        >
                                            <td className="name-cell">
                                                <span className="avatar-chip">{initials(s.name)}</span>
                                                <span style={{ fontWeight: 600 }}>{s.name}</span>
                                            </td>
                                            <td>{s.examsTaken}</td>
                                            <td>
                                                {s.examsTaken > 0 ? (
                                                    <>
                                                        <MiniBar value={s.averageScore} delay={300 + i * 20} />
                                                        <span style={{ color: scoreColor(s.averageScore), fontWeight: 600 }}>{s.averageScore}%</span>
                                                    </>
                                                ) : "—"}
                                            </td>
                                            <td>{s.examsTaken > 0 ? `${s.passRate}%` : "—"}</td>
                                            <td>
                                                <StatusBadge examsTaken={s.examsTaken} needsAttention={s.needsAttention} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}

            {/* ================= STUDENTS TAB ================= */}
            {activeTab === "students" && (
                <div className="tab-content" key="students">
                    <KpiRow items={studentKpis} />

                    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
                        <div className="field" style={{ maxWidth: 320, marginBottom: 0 }}>
                            <label>Search Student</label>
                            <input
                                placeholder="Search by name, or leave blank for all..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                            />
                        </div>
                        <button
                            className={`chip-toggle ${studentAttentionOnly ? "active" : ""}`}
                            onClick={() => setStudentAttentionOnly(v => !v)}
                        >
                            ⚠ Needs Attention only
                        </button>
                    </div>

                    {studentsLoading ? (
                        <div className="loading-row">
                            <span className="spinner" /> Loading students...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <EmptyPrompt
                            icon="🔍"
                            text={studentSearch ? "No students match that name." : "No enrolled students found."}
                        />
                    ) : (
                        <table className="table-modern fade-in">
                            <thead>
                                <tr>
                                    <SortableTh label="Student" sortKey="name" currentSort={studentSort} onSort={toggleSort(setStudentSort)} />
                                    <SortableTh label="Exams Taken" sortKey="examsTaken" currentSort={studentSort} onSort={toggleSort(setStudentSort)} />
                                    <SortableTh label="Average Score" sortKey="averageScore" currentSort={studentSort} onSort={toggleSort(setStudentSort)} />
                                    <SortableTh label="Pass Rate" sortKey="passRate" currentSort={studentSort} onSort={toggleSort(setStudentSort)} />
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((s, i) => (
                                    <tr
                                        key={s.userID}
                                        className={s.examsTaken > 0 ? "clickable-row" : ""}
                                        onClick={() => s.examsTaken > 0 && openStudent(s.userID)}
                                        style={{ animationDelay: `${i * 20}ms` }}
                                    >
                                        <td className="name-cell">
                                            <span className="avatar-chip">{initials(s.name)}</span>
                                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                                        </td>
                                        <td>{s.examsTaken}</td>
                                        <td>
                                            {s.examsTaken > 0 ? (
                                                <>
                                                    <MiniBar value={s.averageScore} delay={300 + i * 20} />
                                                    <span style={{ color: scoreColor(s.averageScore), fontWeight: 600 }}>{s.averageScore}%</span>
                                                </>
                                            ) : "—"}
                                        </td>
                                        <td>{s.examsTaken > 0 ? `${s.passRate}%` : "—"}</td>
                                        <td>
                                            <StatusBadge examsTaken={s.examsTaken} needsAttention={s.needsAttention} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ================= TRAINERS TAB ================= */}
            {activeTab === "trainers" && (
                <div className="tab-content" key="trainers">
                    <KpiRow items={trainerKpis} />

                    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
                        <div className="field" style={{ maxWidth: 320, marginBottom: 0 }}>
                            <label>Search Trainer</label>
                            <input
                                placeholder="Search by name or email..."
                                value={trainerSearch}
                                onChange={(e) => setTrainerSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {trainersLoading ? (
                        <div className="loading-row">
                            <span className="spinner" /> Loading trainers...
                        </div>
                    ) : filteredTrainers.length === 0 ? (
                        <EmptyPrompt
                            icon="🔍"
                            text={trainerSearch ? "No trainers match that search." : "No trainers found."}
                        />
                    ) : (
                        <table className="table-modern fade-in">
                            <thead>
                                <tr>
                                    <SortableTh label="Trainer" sortKey="name" currentSort={trainerSort} onSort={toggleSort(setTrainerSort)} />
                                    <SortableTh label="Courses" sortKey="coursesCount" currentSort={trainerSort} onSort={toggleSort(setTrainerSort)} />
                                    <SortableTh label="Students" sortKey="totalStudents" currentSort={trainerSort} onSort={toggleSort(setTrainerSort)} />
                                    <SortableTh label="Avg Score" sortKey="averageScore" currentSort={trainerSort} onSort={toggleSort(setTrainerSort)} />
                                    <SortableTh label="Pass Rate" sortKey="passRate" currentSort={trainerSort} onSort={toggleSort(setTrainerSort)} />
                                    <th>AI Report</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTrainers.map((t, i) => (
                                    <tr
                                        key={t.userID}
                                        className={t.totalExams > 0 ? "clickable-row" : ""}
                                        onClick={() => openTrainer(t.userID)}
                                        style={{ animationDelay: `${i * 20}ms` }}
                                    >
                                        <td className="name-cell">
                                            <span className="avatar-chip">{initials(t.name)}</span>
                                            <span style={{ fontWeight: 600 }}>{t.name}</span>
                                        </td>
                                        <td>{t.coursesCount}</td>
                                        <td>{t.totalStudents}</td>
                                        <td>
                                            {t.totalExams > 0 ? (
                                                <>
                                                    <MiniBar value={t.averageScore} delay={300 + i * 20} />
                                                    <span style={{ color: scoreColor(t.averageScore), fontWeight: 600 }}>{t.averageScore}%</span>
                                                </>
                                            ) : "—"}
                                        </td>
                                        <td>{t.totalExams > 0 ? `${t.passRate}%` : "—"}</td>
                                        <td>
                                            {t.totalExams > 0 && (
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={(e) => { e.stopPropagation(); openTrainer(t.userID); }}
                                                >
                                                    AI Report
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ================= EXAM RANKING TAB ================= */}
            {activeTab === "exams" && (
                <div className="tab-content" key="exams">
                    <CourseSelect
                        courses={courses}
                        value={examCourseId}
                        onChange={setExamCourseId}
                        placeholder="Select a course to rank its exams..."
                    />

                    {!examCourseId ? (
                        <EmptyPrompt icon="🏆" text="Select a course above to see its exams ranked by performance." />
                    ) : examLoading ? (
                        <ChartCard title="Exam Ranking" height={260}>
                            <ChartSkeleton rows={6} height={220} />
                        </ChartCard>
                    ) : examRanking.length === 0 ? (
                        <EmptyPrompt icon="🗒️" text="No graded attempts for this course's exams yet." />
                    ) : (
                        <>
                            <KpiRow items={examKpis} />

                            <ChartCard
                                title="Exam Ranking"
                                subtitle="Average score per exam, highest to lowest"
                                height={Math.max(220, examChartData.length * 38)}
                                delay={50}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={examChartData} key={examCourseId} layout="vertical" barCategoryGap="18%" barSize={20} margin={{ top: 4, right: 30, left: 8, bottom: 4 }}>
                                        <ScoreGradientDefs />
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: INK_SOFT }} />
                                        <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: INK_SOFT }} />
                                        <Tooltip content={<CustomTooltip />} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} cursor={{ fill: "rgba(108,92,231,.06)" }} />
                                        <Bar dataKey="score" name="Average Score" radius={[0, 6, 6, 0]}
                                            isAnimationActive={!reducedMotion}
                                            animationBegin={100}
                                            animationDuration={1000}
                                            animationEasing="ease-out"
                                        >
                                            {examChartData.map((entry, i) => (
                                                <Cell key={i} fill={scoreFill(entry.score)} />
                                            ))}
                                            <LabelList dataKey="score" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 12, fill: "var(--ink)" }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <table className="table-modern fade-in">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Exam</th>
                                        <th>Attempts</th>
                                        <th>Average Score</th>
                                        <th>Pass Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {examRanking.map((e, i) => (
                                        <tr key={e.examID} style={{ animationDelay: `${i * 20}ms` }}>
                                            <td style={{ fontWeight: 700 }}>{rankMedal(i + 1)}</td>
                                            <td style={{ fontWeight: 600 }}>{e.examTitle}</td>
                                            <td>{e.attemptCount}</td>
                                            <td>
                                                <MiniBar value={e.averageScore} delay={300 + i * 20} />
                                                <span style={{ color: scoreColor(e.averageScore), fontWeight: 600 }}>{e.averageScore}%</span>
                                            </td>
                                            <td>{e.passRate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}

            {/* ================= GRADES TAB ================= */}
            {activeTab === "grades" && (
                <div className="tab-content" key="grades">
                    <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--info-bg)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--ink-soft)" }}>
                        <strong>Weighted Grading:</strong> Quiz Score (30%) + Exam Score (70%) = Final Grade
                    </div>
                    <CourseSelect
                        courses={courses}
                        value={gradesCourseId}
                        onChange={setGradesCourseId}
                        placeholder="Select a course to see student grades..."
                    />

                    {!gradesCourseId ? (
                        <EmptyPrompt icon="📊" text="Select a course above to view student grades." />
                    ) : gradesLoading ? (
                        <ChartCard title="Student Grades" height={260}>
                            <ChartSkeleton rows={5} height={220} />
                        </ChartCard>
                    ) : gradesData.length === 0 ? (
                        <EmptyPrompt icon="📋" text="No enrolled students in this course yet." />
                    ) : (
                        <>
                            <KpiRow items={[
                                { label: "Students", value: gradesData.length },
                                { label: "With Grades", value: gradesData.filter(g => g.overallAverage != null).length, cardClass: "stat-card-blue" },
                                { label: "Class Average", value: (() => {
                                    const graded = gradesData.filter(g => g.overallAverage != null);
                                    return graded.length ? `${Math.round(graded.reduce((s, g) => s + g.overallAverage, 0) / graded.length * 10) / 10}%` : "—";
                                })(), cardClass: gradesData.filter(g => g.overallAverage != null).length ? scoreCardClass(Math.round(gradesData.filter(g => g.overallAverage != null).reduce((s, g) => s + g.overallAverage, 0) / gradesData.filter(g => g.overallAverage != null).length)) : undefined }
                            ]} />

                            <table className="table-modern fade-in">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Quiz Score (30%)</th>
                                        <th>Exam Score (70%)</th>
                                        <th>Final Grade</th>
                                        <th>Letter</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gradesData.map((s, i) => {
                                        const g = s.grades?.[0];
                                        const finalGrade = g?.finalGrade;
                                        return (
                                            <tr key={s.userID} style={{ animationDelay: `${i * 20}ms` }}>
                                                <td className="name-cell">
                                                    <span className="avatar-chip">{initials(s.userName)}</span>
                                                    <span style={{ fontWeight: 600 }}>{s.userName}</span>
                                                </td>
                                                <td>
                                                    {g?.quizScore != null ? (
                                                        <>
                                                            <MiniBar value={g.quizScore} delay={200 + i * 30} />
                                                            <span style={{ color: scoreColor(g.quizScore), fontWeight: 600 }}>{g.quizScore}%</span>
                                                        </>
                                                    ) : "—"}
                                                </td>
                                                <td>
                                                    {g?.examScore != null ? (
                                                        <>
                                                            <MiniBar value={g.examScore} delay={200 + i * 30} />
                                                            <span style={{ color: scoreColor(g.examScore), fontWeight: 600 }}>{g.examScore}%</span>
                                                        </>
                                                    ) : "—"}
                                                </td>
                                                <td>
                                                    {finalGrade != null ? (
                                                        <span style={{ fontWeight: 700, fontSize: 15, color: scoreColor(finalGrade) }}>
                                                            {finalGrade}%
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "var(--ink-soft)" }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {finalGrade != null ? (
                                                        <span className="badge" style={{
                                                            background: scoreColor(finalGrade),
                                                            color: "#fff",
                                                            fontWeight: 700
                                                        }}>
                                                            {scoreGrade(finalGrade)}
                                                        </span>
                                                    ) : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}

            {/* ---- Shared student/trainer detail panel ---- */}
            <SidePanel
                open={panelOpen}
                title={detail ? detail.name : panelType === "trainer" ? "Trainer Details" : "Student Details"}
                subtitle={detail
                    ? panelType === "trainer"
                        ? `${detail.coursesCount} course(s), ${detail.totalStudents} student(s)`
                        : `${detail.examsTaken} exam(s) taken across all enrolled courses`
                    : undefined}
                onClose={closePanel}
                wide={true}
                footer={
                    <>
                        {!aiReport && detail && (
                            (panelType === "trainer" && detail.totalExams > 0) ||
                            (panelType === "student" && detail.examsTaken > 0)
                        ) && (
                            <button className="btn btn-primary" onClick={generateReport} disabled={aiReportLoading}>
                                {aiReportLoading ? (
                                    <><span className="spinner" /> Generating...</>
                                ) : (
                                    "AI Report"
                                )}
                            </button>
                        )}
                        <button className="btn btn-outline" onClick={closePanel}>Close</button>
                    </>
                }
            >
                {detailLoading ? (
                    <ChartSkeleton rows={4} height={160} />
                ) : detail && (
                    <>
                        {/* ---- Trainer detail panel ---- */}
                        {panelType === "trainer" && (
                            <>
                                <div className="stat-grid" style={{ marginBottom: 22 }}>
                                    <div className="stat-card stat-card-purple">
                                        <div className="num" style={{ color: "#fff" }}>{detail.coursesCount}</div>
                                        <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Courses</div>
                                    </div>
                                    <div className="stat-card stat-card-blue">
                                        <div className="num" style={{ color: "#fff" }}>{detail.totalStudents}</div>
                                        <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Students</div>
                                    </div>
                                    <div className={`stat-card ${scoreCardClass(detail.averageScore)}`}>
                                        <div className="num" style={{ color: "#fff" }}>{detail.averageScore}%</div>
                                        <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Avg Score</div>
                                    </div>
                                    <div className="stat-card stat-card-yellow">
                                        <div className="num" style={{ color: "#fff" }}>{detail.passRate}%</div>
                                        <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Pass Rate</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
                                    <span style={{ fontWeight: 600 }}>Email:</span> {detail.email}
                                </div>

                                {detail.courses?.length > 0 && (
                                    <div style={{ marginBottom: 24 }}>
                                        <h4 style={{ marginBottom: 10 }}>Average Score by Course</h4>
                                        <div style={{ width: "100%", height: Math.max(160, trainerCourseData.length * 46) }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={trainerCourseData} key={detail?.userID} layout="vertical" barCategoryGap="18%" barSize={20} margin={{ top: 4, right: 36, left: 8, bottom: 4 }}>
                                                    <ScoreGradientDefs />
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: INK_SOFT }} />
                                                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: INK_SOFT }} />
                                                    <Tooltip content={<CustomTooltip />} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} cursor={{ fill: "rgba(108,92,231,.06)" }} />
                                                    <Bar dataKey="score" name="Average Score" radius={[0, 6, 6, 0]}
                                                        isAnimationActive={!reducedMotion}
                                                        animationBegin={150}
                                                        animationDuration={1400}
                                                        animationEasing="ease-out"
                                                    >
                                                        {trainerCourseData.map((entry, i) => (
                                                            <Cell key={i} fill={scoreFill(entry.score)} />
                                                        ))}
                                                        <LabelList dataKey="score" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: "var(--ink)" }} />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {detail.courses?.length === 0 && (
                                    <EmptyPrompt icon="📚" text="This trainer has no courses assigned yet." />
                                )}
                            </>
                        )}

                        {/* ---- Student detail panel ---- */}
                        {panelType === "student" && (
                            <>
                                <div className="stat-grid" style={{ marginBottom: 22 }}>
                                    <div className={`stat-card ${scoreCardClass(detail.averageScore)}`}>
                                        <div className="num" style={{ color: "#fff" }}>{detail.averageScore}%</div>
                                        <div className="label" style={{ color: "rgba(255,255,255,.9)" }}>Average Score</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="num">{detail.passRate}%</div>
                                        <div className="label">Pass Rate</div>
                                    </div>
                                </div>

                                {(detail.strongestCourse || detail.weakestCourse) && (
                                    <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
                                        {detail.strongestCourse && (
                                            <span className="badge badge-success">💪 Strongest: {detail.strongestCourse}</span>
                                        )}
                                        {detail.weakestCourse && detail.weakestCourse !== detail.strongestCourse && (
                                            <span className="badge badge-danger">⚠️ Weakest: {detail.weakestCourse}</span>
                                        )}
                                    </div>
                                )}

                                {courseBreakdownData.length > 0 && (
                                    <div style={{ marginBottom: 24 }}>
                                        <h4 style={{ marginBottom: 10 }}>Score by Enrolled Course</h4>
                                        <div style={{ width: "100%", height: Math.max(140, courseBreakdownData.length * 42) }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={courseBreakdownData} key={detail?.userID} layout="vertical" barCategoryGap="18%" barSize={20} margin={{ top: 4, right: 28, left: 8, bottom: 4 }}>
                                                    <ScoreGradientDefs />
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: INK_SOFT }} />
                                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: INK_SOFT }} />
                                                    <Tooltip content={<CustomTooltip />} labelFormatter={(_, p) => p?.[0]?.payload?.fullName} cursor={{ fill: "rgba(108,92,231,.06)" }} />
                                                    <Bar dataKey="score" name="Average Score" radius={[0, 6, 6, 0]}
                                                        isAnimationActive={!reducedMotion}
                                                        animationBegin={150}
                                                        animationDuration={1400}
                                                        animationEasing="ease-out"
                                                    >
                                                        {courseBreakdownData.map((entry, i) => (
                                                            <Cell key={i} fill={scoreFill(entry.score)} />
                                                        ))}
                                                        <LabelList dataKey="score" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: "var(--ink)" }} />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {skillTypeData.length > 0 && (
                                    <div style={{ marginBottom: 24 }}>
                                        <h4 style={{ marginBottom: 10 }}>By Question Type</h4>
                                        <div style={{ width: "100%", height: 120 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={skillTypeData} key={detail?.userID} layout="vertical" barCategoryGap="20%" barSize={22} margin={{ top: 4, right: 28, left: 8, bottom: 4 }}>
                                                    <ScoreGradientDefs />
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: INK_SOFT }} />
                                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: INK_SOFT }} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(108,92,231,.06)" }} />
                                                    <Bar dataKey="score" name="Score" radius={[0, 6, 6, 0]}
                                                        isAnimationActive={!reducedMotion}
                                                        animationBegin={150}
                                                        animationDuration={1400}
                                                        animationEasing="ease-out"
                                                    >
                                                        {skillTypeData.map((entry, i) => (
                                                            <Cell key={i} fill={scoreFill(entry.score)} />
                                                        ))}
                                                        <LabelList dataKey="score" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: "var(--ink)" }} />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {detail.weakestExams.length > 0 && (
                                    <>
                                        <h4 style={{ margin: "22px 0 10px" }}>Lowest-Scoring Exams</h4>
                                        {detail.weakestExams.map(e => (
                                            <div key={`weak-${e.examID}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                                                <span>{e.examTitle}</span>
                                                <span className="badge badge-danger">{e.score}%</span>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {detail.strongestExams.length > 0 && (
                                    <>
                                        <h4 style={{ margin: "22px 0 10px" }}>Highest-Scoring Exams</h4>
                                        {detail.strongestExams.map(e => (
                                            <div key={`strong-${e.examID}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                                                <span>{e.examTitle}</span>
                                                <span className="badge badge-success">{e.score}%</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        )}

                        {/* ---- AI Report ---- */}
                        {aiReportLoading && (
                            <div className="ai-report-loading">
                                <span className="spinner" /> Analyzing performance data...
                            </div>
                        )}

                        {aiReport && !aiReportLoading && (
                            <div className="ai-report">
                                <div className="ai-report-header">
                                    <span className="ai-report-icon">AI</span>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: 15 }}>AI Performance Report</h4>
                                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>
                                            {panelType === "trainer"
                                                ? `Generated from ${detail.totalExams} exam submission(s) across ${detail.coursesCount} course(s)`
                                                : `Generated from ${detail.examsTaken} exam(s) across ${detail.courseBreakdown?.length || 0} course(s)`}
                                        </p>
                                    </div>
                                </div>

                                <div className={`ai-report-level ai-report-level--${aiReport.level}`}>
                                    {aiReport.levelLabel}
                                </div>

                                <p className="ai-report-summary">{aiReport.summary}</p>

                                {aiReport.sections.map((section, i) => (
                                    <div
                                        key={i}
                                        className={`ai-report-section ${section.accent ? `ai-report-section--${section.accent}` : ""}`}
                                    >
                                        <div className="ai-report-section-title">
                                            <span>{section.icon}</span> {section.title}
                                        </div>
                                        <p className="ai-report-section-text">{section.text}</p>

                                        {section.metrics && (
                                            <div className="ai-report-metrics">
                                                {section.metrics.map((m, j) => (
                                                    <div key={j} className="ai-report-metric">
                                                        <span className="ai-report-metric-value" style={{ color: m.color }}>{m.value}</span>
                                                        <span className="ai-report-metric-label">{m.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {section.items && (
                                            <ul className="ai-report-list">
                                                {section.items.map((item, j) => (
                                                    <li key={j}>{item}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </SidePanel>

            {toastEl}

        </div>
    );
}

export default Statistics;