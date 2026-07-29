import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getThreads, getThread, createThread, createReply } from "../services/ForumService";
import { getCourses } from "../services/CourseService";
import SidePanel from "../components/SidePanel";
import useToast from "../hooks/useToast";

function Forum() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showToast, toastEl } = useToast();
    const [panelOpen, setPanelOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [courseTitle, setCourseTitle] = useState("");
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState({ title: "", content: "" });
    const [replyText, setReplyText] = useState("");
    const [replying, setReplying] = useState(false);

    const { role } = useAuth();

    useEffect(() => {
        if (courseId) {
            loadData();
            loadCourse();
        } else {
            loadCourses();
        }
    }, [courseId]);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const res = await getCourses("", 1, 100);
            setCourses(res.data.items || []);
        } catch (err) { console.error(err);
            showToast("Could not load courses.", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getThreads(courseId);
            setThreads(res.data);
        } catch (err) { console.error(err);
            showToast("Could not load discussions.", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadCourse = async () => {
        try {
            const res = await getCourses("", 1, 100);
            const c = res.data.items.find(c => c.courseID === parseInt(courseId));
            if (c) setCourseTitle(c.title);
        } catch (err) { console.error(err); }
    };

    const openThread = async (id) => {
        try {
            const res = await getThread(id);
            setSelectedThread(res.data);
        } catch (err) { console.error(err);
            showToast("Could not load thread.", "error");
        }
    };

    const handleCreateThread = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            showToast("Title and content are required.", "error");
            return;
        }
        setSaving(true);
        try {
            await createThread({ courseID: parseInt(courseId), title: form.title, content: form.content });
            showToast("Thread created! +5 points", "success");
            setPanelOpen(false);
            setForm({ title: "", content: "" });
            loadData();
        } catch (err) { console.error(err);
            showToast("Failed to create thread.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setReplying(true);
        try {
            const res = await createReply(selectedThread.courseThreadID, replyText);
            setSelectedThread(prev => ({
                ...prev,
                replies: [...prev.replies, res.data]
            }));
            setReplyText("");
            showToast("Reply posted! +2 points", "success");
        } catch (err) { console.error(err);
            showToast("Failed to post reply.", "error");
        } finally {
            setReplying(false);
        }
    };

    if (loading) {
        return <div className="page"><div className="loading-row"><span className="spinner" /> Loading discussions...</div></div>;
    }

    return (
        <div className="page">
            <div className="welcome-banner">
                <h2>Discussions</h2>
                <p>{courseTitle || "Course discussion forum"}</p>
            </div>

            {!courseId ? (
                <>
                    <p style={{ marginBottom: 16, color: "var(--ink-soft)" }}>Select a course to view its discussion forum:</p>
                    <div className="module-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                        {courses.map(c => (
                            <div
                                key={c.courseID}
                                className="card"
                                style={{ cursor: "pointer" }}
                                onClick={() => navigate(`/forum/${c.courseID}`)}
                            >
                                <h4 style={{ margin: "0 0 8px" }}>{c.title}</h4>
                                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{c.description}</p>
                            </div>
                        ))}
                    </div>
                </>
            ) : selectedThread ? (
                <>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelectedThread(null)} style={{ marginBottom: 16 }}>
                        &larr; Back to threads
                    </button>

                    <div className="card" style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <h3 style={{ margin: 0 }}>{selectedThread.title}</h3>
                            {selectedThread.isPinned && <span className="badge badge-success">Pinned</span>}
                        </div>
                        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
                            Posted by <strong>{selectedThread.authorName}</strong> &middot; {new Date(selectedThread.createdAt).toLocaleDateString()}
                        </p>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{selectedThread.content}</div>
                    </div>

                    <h4 style={{ marginBottom: 12 }}>Replies ({selectedThread.replies.length})</h4>

                    {selectedThread.replies.map(reply => (
                        <div key={reply.threadReplyID} className="card" style={{ marginBottom: 12, padding: "16px 20px" }}>
                            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6 }}>
                                <strong>{reply.authorName}</strong> &middot; {new Date(reply.createdAt).toLocaleDateString()}
                            </div>
                            <div style={{ whiteSpace: "pre-wrap" }}>{reply.content}</div>
                        </div>
                    ))}

                    <div className="card" style={{ marginTop: 16 }}>
                        <textarea
                            rows="3"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                        <button className="btn btn-primary btn-sm" onClick={handleReply} disabled={replying || !replyText.trim()} style={{ marginTop: 8 }}>
                            {replying ? "Posting..." : "Post Reply"}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="page-header">
                        <div>
                            <h2 style={{ marginTop: 0 }}>Threads</h2>
                        </div>
                        <button className="btn btn-primary" onClick={() => setPanelOpen(true)}>
                            + New Thread
                        </button>
                    </div>

                    {threads.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon">💬</div>
                            <p>No discussions yet. Start one!</p>
                        </div>
                    ) : (
                        threads.map(thread => (
                            <div
                                key={thread.courseThreadID}
                                className="card"
                                style={{ marginBottom: 12, cursor: "pointer" }}
                                onClick={() => openThread(thread.courseThreadID)}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                            {thread.isPinned && <span style={{ marginRight: 8 }}>📌</span>}
                                            {thread.title}
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                                            {thread.authorName} &middot; {new Date(thread.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", fontSize: 13, color: "var(--ink-soft)" }}>
                                        <div>{thread.replyCount} replies</div>
                                        <div style={{ marginTop: 4 }}>{thread.lastActivityAt ? new Date(thread.lastActivityAt).toLocaleDateString() : ""}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            <SidePanel
                open={panelOpen}
                title="New Discussion Thread"
                subtitle="Start a new topic in this course"
                onClose={() => setPanelOpen(false)}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setPanelOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleCreateThread} disabled={saving}>
                            {saving ? "Creating..." : "Create Thread"}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Title</label>
                    <input
                        placeholder="e.g. Question about Lesson 3"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        autoFocus
                    />
                </div>
                <div className="field">
                    <label>Content</label>
                    <textarea
                        rows="6"
                        placeholder="Write your question or discussion topic..."
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                    />
                </div>
            </SidePanel>

            {toastEl}
        </div>
    );
}

export default Forum;
