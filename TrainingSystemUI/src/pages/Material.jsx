import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    getMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
} from "../services/MaterialService";
import { getLessons } from "../services/LessonService";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import SidePanel from "../components/SidePanel";
import Pagination from "../components/Pagination";

const FILE_HOST = (import.meta.env.VITE_API_URL || "http://localhost:5149/api").replace(/\/api\/?$/, "");

const blankForm = () => ({
    title: "",
    lessonID: "",
    file: null,
    videoUrl: ""
});

function getEmbedUrl(url) {
    if (!url) return null;
    const trimmed = url.trim();

    // YouTube
    const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    // Direct video file
    if (/\.(mp4|webm|ogg)$/i.test(trimmed)) return null;

    return trimmed;
}

function isDirectVideo(url) {
    return url && /\.(mp4|webm|ogg)$/i.test(url.trim());
}

function Material() {

    const [searchParams, setSearchParams] = useSearchParams();
    const role = localStorage.getItem("role");
    const canManage = role === "Admin" || role === "Trainer";

    const [materials, setMaterials] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [lessonFilter, setLessonFilter] = useState(searchParams.get("lessonId") || "");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const [toast, setToast] = useState(null);
    const [previewMaterial, setPreviewMaterial] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [form, setForm] = useState(blankForm());

    useEffect(() => {
        loadMaterials();
        loadLessons();
    }, [page]);

    const loadMaterials = async () => {
        setLoading(true);
        try {
            const res = await getMaterials();
            setMaterials(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch {
            setToast({ message: "Couldn't load materials. Try refreshing.", type: "error" });
        }
        finally {
            setLoading(false);
        }
    };

    const loadLessons = async () => {
        const res = await getLessons("", "", 1, 100);
        setLessons(res.data.items);
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

    const openEditPanel = (material) => {
        setEditingId(material.materialID);
        setForm({
            title: material.title,
            lessonID: material.lessonID,
            file: null,
            videoUrl: material.videoUrl || ""
        });
        setPanelOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.lessonID) {
            setToast({ message: "Title and lesson are required.", type: "error" });
            return;
        }

        if (editingId == null && !form.file && !form.videoUrl.trim()) {
            setToast({ message: "Please upload a file or enter a video URL.", type: "error" });
            return;
        }

        const data = new FormData();
        data.append("Title", form.title);
        data.append("LessonID", form.lessonID);
        if (form.file) {
            data.append("File", form.file);
        }
        if (form.videoUrl.trim()) {
            data.append("VideoUrl", form.videoUrl.trim());
        }

        setSaving(true);

        try {
            if (editingId == null) {
                await createMaterial(data);
                setToast({ message: "Material created.", type: "success" });
            } else {
                await updateMaterial(editingId, data);
                setToast({ message: "Material updated.", type: "success" });
            }

            closePanel();
            loadMaterials();
        }
        catch (err) {
            console.log(err);
            setToast({ message: "Operation failed.", type: "error" });
        }
        finally {
            setSaving(false);
        }
    };

    const handleDelete = (material) => {
        setConfirmState({
            title: `Delete "${material.title}"?`,
            message: "This can't be undone.",
            confirmLabel: "Delete material",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteMaterial(material.materialID);
                    setToast({ message: "Material deleted.", type: "success" });
                    loadMaterials();
                }
                catch {
                    setToast({ message: "Couldn't delete that material.", type: "error" });
                }
            }
        });
    };

    const visibleMaterials = lessonFilter
        ? materials.filter(m => String(m.lessonID) === String(lessonFilter))
        : materials;

    const renderPreview = (material) => {
        if (material.videoUrl) {
            const embedUrl = getEmbedUrl(material.videoUrl);
            if (embedUrl) {
                return (
                    <div className="video-embed-container">
                        <iframe
                            src={embedUrl}
                            title={material.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            }
            if (isDirectVideo(material.videoUrl)) {
                return (
                    <div className="video-embed-container">
                        <video controls>
                            <source src={material.videoUrl.trim()} />
                            Your browser does not support video.
                        </video>
                    </div>
                );
            }
        }
        if (material.filePath) {
            const ext = material.filePath.split(".").pop().toLowerCase();
            if (["mp4", "webm", "ogg"].includes(ext)) {
                return (
                    <div className="video-embed-container">
                        <video controls>
                            <source src={`${FILE_HOST}${material.filePath}`} type={`video/${ext}`} />
                            Your browser does not support video.
                        </video>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="page">

            <div className="welcome-banner">
                <h2>Material Management</h2>
                <p>Upload files and add video lessons</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Materials</h2>
                </div>

                {canManage && (
                    <button className="btn btn-primary" onClick={openCreatePanel}>
                        + New Material
                    </button>
                )}
            </div>

            <div className="card fade-in" style={{ marginBottom: 24 }}>
                <div className="form-grid">
                    <div className="field">
                        <label>Filter by Lesson</label>
                        <select
                            value={lessonFilter}
                            onChange={(e) => {
                                setLessonFilter(e.target.value);
                                if (e.target.value) {
                                    setSearchParams({ lessonId: e.target.value });
                                } else {
                                    setSearchParams({});
                                }
                            }}
                        >
                            <option value="">All Lessons</option>
                            {lessons.map(l => (
                                <option key={l.lessonID} value={l.lessonID}>
                                    {l.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading materials...
                </div>
            ) : visibleMaterials.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📎</div>
                    <p>
                        {lessonFilter
                            ? "No materials for this lesson yet."
                            : "No materials yet. Upload one to get started."}
                    </p>
                </div>
            ) : (
                <div className="materials-grid fade-in">
                    {visibleMaterials.map(material => {
                        const preview = renderPreview(material);
                        const hasVideo = !!material.videoUrl || (material.filePath && ["mp4","webm","ogg"].includes(material.filePath.split(".").pop().toLowerCase()));

                        return (
                            <div key={material.materialID} className="material-card card">
                                {preview && (
                                    <div className="material-preview">
                                        {preview}
                                    </div>
                                )}
                                <div className="material-info">
                                    <div className="material-header">
                                        <h4 className="material-title">{material.title}</h4>
                                        {hasVideo && <span className="badge badge-video">Video</span>}
                                    </div>
                                    <span className="pill pill-mc">{material.lessonTitle}</span>
                                    <div className="material-links">
                                        {material.filePath && (
                                            <a
                                                className="btn btn-outline btn-sm"
                                                href={`${FILE_HOST}${material.filePath}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Download File
                                            </a>
                                        )}
                                        {material.videoUrl && !getEmbedUrl(material.videoUrl) && !isDirectVideo(material.videoUrl) && (
                                            <a
                                                className="btn btn-outline btn-sm"
                                                href={material.videoUrl.trim()}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open Video Link
                                            </a>
                                        )}
                                    </div>
                                    {canManage && (
                                        <div className="material-manage">
                                            <button className="btn btn-outline btn-sm" onClick={() => openEditPanel(material)}>
                                                Edit
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(material)}>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Add Material" : "Edit Material"}
                subtitle={editingId != null ? `Editing "${form.title}"` : undefined}
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
                                ? (saving ? "Adding..." : "Add Material")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Title</label>
                    <input
                        placeholder="Material Title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        autoFocus
                    />
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Lesson</label>
                    <select
                        value={form.lessonID}
                        onChange={(e) => setForm({ ...form, lessonID: e.target.value })}
                        disabled={editingId != null}
                    >
                        <option value="">Select Lesson</option>
                        {lessons.map(l => (
                            <option key={l.lessonID} value={l.lessonID}>
                                {l.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Video URL (YouTube, Vimeo, or direct .mp4 link)</label>
                    <input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={form.videoUrl}
                        onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    />
                    <small style={{ color: "var(--ink-soft)", fontSize: "12px", marginTop: 4, display: "block" }}>
                        Paste a YouTube, Vimeo, or direct video URL. Leave empty for file-only materials.
                    </small>
                </div>

                <div className="field">
                    <label>{editingId == null ? "File (optional if video URL provided)" : "Replace File (optional)"}</label>
                    <input
                        type="file"
                        onChange={(e) => setForm({ ...form, file: e.target.files[0] ?? null })}
                    />
                </div>
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            <Toast toast={toast} onDone={() => setToast(null)} />

        </div>
    );
}

export default Material;
