import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getMyEnrollments } from "../services/EnrollmentService";
import {
    getCourseProgress,
    getResumePoint,
    startTracking,
    updateProgress
} from "../services/LessonProgressService";
import Toast from "../components/Toast";

function MyLearning() {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [courseData, setCourseData] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const enrollRes = await getMyEnrollments();
            const myEnrollments = enrollRes.data.filter(e =>
                e.status !== "Dropped"
            );
            setEnrollments(myEnrollments);

            const progressPromises = myEnrollments.map(e =>
                getCourseProgress(e.courseID).then(res => ({
                    courseId: e.courseID,
                    data: res.data
                }))
            );

            const results = await Promise.all(progressPromises);
            const dataMap = {};
            results.forEach(r => { dataMap[r.courseId] = r.data; });
            setCourseData(dataMap);
        }
        catch {
            setToast({ message: "Couldn't load your courses.", type: "error" });
        }
        finally {
            setLoading(false);
        }
    };

    const handleResume = async (courseId) => {
        try {
            const res = await getResumePoint(courseId);
            const point = res.data;

            if (point.completed) {
                setToast({ message: "You've completed all lessons in this course!", type: "success" });
                return;
            }

            if (point.lessonId) {
                const trackingData = { lessonID: point.lessonId, courseID: courseId };
                await startTracking(trackingData);
                navigate(`/learn/${point.lessonId}`);
            }
        }
        catch {
            setToast({ message: "Couldn't load resume point.", type: "error" });
        }
    };

    const handleLessonClick = async (courseId, lesson) => {
        if (lesson.isUnlocked === false) {
            setToast({ message: "Complete the previous lesson first to unlock this one.", type: "error" });
            return;
        }
        try {
            await startTracking({ lessonID: lesson.lessonID, courseID: courseId });
            navigate(`/learn/${lesson.lessonID}`);
        }
        catch (err) {
            const msg = err.response?.data?.message || "Couldn't start tracking this lesson.";
            setToast({ message: msg, type: "error" });
        }
    };

    const handleToggleComplete = async (courseId, lessonId, isCompleted) => {
        try {
            const res = await startTracking({ lessonID: lessonId, courseID: courseId });
            await updateProgress(res.data.lessonProgressID, { isCompleted: !isCompleted });
            loadData();
        }
        catch {
            setToast({ message: "Couldn't update progress.", type: "error" });
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="welcome-banner">
                    <h2>My Learning</h2>
                    <p>Track your progress across all courses</p>
                </div>
                <div className="loading-row">
                    <span className="spinner" /> Loading your courses...
                </div>
            </div>
        );
    }

    return (
        <div className="page">

            <div className="welcome-banner">
                <h2>My Learning</h2>
                <p>Track your progress across all courses</p>
            </div>

            {enrollments.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">&#128218;</div>
                    <p>You're not enrolled in any courses yet.</p>
                </div>
            ) : (
                <div className="learning-courses fade-in">
                    {enrollments.map(enrollment => {
                        const progress = courseData[enrollment.courseID];
                        const percent = progress?.progressPercent || 0;
                        const completed = progress?.completedLessons || 0;
                        const total = progress?.totalLessons || 0;

                        return (
                            <div key={enrollment.enrollmentID} className="card learning-course-card">
                                <div className="learning-course-header">
                                    <div>
                                        <h3 style={{ margin: 0 }}>{enrollment.courseTitle}</h3>
                                        <span className={`badge ${enrollment.status === "Completed" ? "badge-success" : ""}`}>
                                            {enrollment.status}
                                        </span>
                                    </div>
                                    <div className="learning-course-actions">
                                        {percent < 100 && total > 0 && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleResume(enrollment.courseID)}
                                            >
                                                Continue Learning
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="learning-progress-bar">
                                    <div className="learning-progress-track">
                                        <div
                                            className="learning-progress-fill"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <span className="learning-progress-text">
                                        {completed}/{total} lessons ({percent}%)
                                    </span>
                                </div>

                                {progress?.lessons && progress.lessons.length > 0 && (
                                    <div className="learning-lessons">
                                        {progress.lessons.map((lesson, idx) => {
                                            const isLocked = role === "Student" && lesson.isUnlocked === false;
                                            return (
                                                <div
                                                    key={lesson.lessonID}
                                                    className={`learning-lesson ${lesson.isCompleted ? "completed" : ""} ${isLocked ? "locked" : ""}`}
                                                >
                                                    <div className="learning-lesson-check">
                                                        <button
                                                            className={`check-btn ${lesson.isCompleted ? "checked" : ""}`}
                                                            onClick={() => handleToggleComplete(
                                                                enrollment.courseID,
                                                                lesson.lessonID,
                                                                lesson.isCompleted
                                                            )}
                                                            title={isLocked ? "Locked" : lesson.isCompleted ? "Mark incomplete" : "Mark complete"}
                                                            disabled={isLocked}
                                                        >
                                                            {isLocked ? "\uD83D\uDD12" : lesson.isCompleted ? "\u2713" : ""}
                                                        </button>
                                                    </div>
                                                    <div
                                                        className="learning-lesson-info"
                                                        onClick={() => handleLessonClick(enrollment.courseID, lesson)}
                                                        style={isLocked ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                                                    >
                                                        <span className="learning-lesson-num">{idx + 1}</span>
                                                        <div>
                                                            <div className="learning-lesson-title">
                                                                {lesson.title}
                                                                {isLocked && (
                                                                    <span style={{ fontSize: 11, color: "var(--ink-soft)", marginLeft: 8 }}>
                                                                        Complete previous lesson first
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {lesson.lastMaterialTitle && !isLocked && (
                                                                <div className="learning-lesson-last-text">
                                                                    Last: {lesson.lastMaterialTitle}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Toast toast={toast} onDone={() => setToast(null)} />

        </div>
    );
}

export default MyLearning;
