import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getFileUrl } from "../api/axios";
import {
    getMaterials,
    getMaterialsByLesson,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getStorageUsage
} from "../services/MaterialService";
import { getLessons } from "../services/LessonService";
import ConfirmDialog from "../components/ConfirmDialog";
import useToast from "../hooks/useToast";
import { Video, FileText, FolderOpen, Paperclip, Upload, Link, Check } from "lucide-react";
import SidePanel from "../components/SidePanel";
import Pagination from "../components/Pagination";

const blankForm = () => ({
    title: "",
    lessonID: "",
    file: null,
    videoUrl: ""
});

function getEmbedUrl(url) {
    if (!url) return null;
    const trimmed = url.trim();
    const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    if (/\.(mp4|webm|ogg|mov)$/i.test(trimmed)) return null;
    return trimmed;
}

const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov"];
const AUDIO_EXTS = ["mp3", "wav", "m4a", "flac", "aac", "ogg"];

function getFileExt(filePathOrName) {
    if (!filePathOrName) return "";
    return filePathOrName.split(".").pop().toLowerCase();
}

function isVideoExt(ext) { return VIDEO_EXTS.includes(ext); }
function isAudioExt(ext) { return AUDIO_EXTS.includes(ext); }

function isDirectVideo(url) {
    return url && /\.(mp4|webm|ogg|mov)$/i.test(url.trim());
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

function truncateFilename(name, maxLen = 40) {
    if (!name || name.length <= maxLen) return name;
    const ext = getFileExt(name);
    const base = name.slice(0, name.lastIndexOf("."));
    const keep = maxLen - ext.length - 4;
    if (keep < 8) return name.slice(0, maxLen - 3) + "...";
    return base.slice(0, keep) + "..." + ext;
}

function VideoRecorder({ onRecordingComplete }) {
    const [state, setState] = useState("idle");
    const [stream, setStream] = useState(null);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [cameraError, setCameraError] = useState(null);
    const previewRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const videoPreviewRef = useRef(null);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
                audio: true
            });
            setStream(s);
            if (previewRef.current) previewRef.current.srcObject = s;
            setState("ready");
        } catch (err) {
            setCameraError("Camera access denied. Please allow camera/microphone permissions or use file upload instead.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
    }, [stream]);

    const startRecording = () => {
        chunksRef.current = [];
        setRecordedBlob(null);
        setRecordingTime(0);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
        recorderRef.current = recorder;
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            setRecordedBlob(blob);
            if (videoPreviewRef.current) videoPreviewRef.current.src = URL.createObjectURL(blob);
        };
        recorder.start(1000);
        setState("recording");
        timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    };

    const stopRecording = () => {
        recorderRef.current?.stop();
        clearInterval(timerRef.current);
        setState("preview");
    };

    const pauseRecording = () => {
        if (recorderRef.current?.state === "recording") {
            recorderRef.current.pause();
            clearInterval(timerRef.current);
            setState("paused");
        }
    };

    const resumeRecording = () => {
        if (recorderRef.current?.state === "paused") {
            recorderRef.current.resume();
            setState("recording");
            timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        }
    };

    useEffect(() => {
        return () => { stopCamera(); clearInterval(timerRef.current); };
    }, [stopCamera]);

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    if (cameraError) {
        return (
            <div className="recorder-error">
                <p>{cameraError}</p>
            </div>
        );
    }

    if (state === "idle") {
        return (
            <div className="recorder-start">
                <div className="recorder-icon"><Video size={32} /></div>
                <p>Record a video using your camera and microphone</p>
                <button className="btn btn-primary" onClick={startCamera}>
                    Start Camera
                </button>
            </div>
        );
    }

    return (
        <div className="recorder-container">
            <div className="recorder-preview-wrap">
                <video ref={previewRef} autoPlay muted playsInline className={`recorder-preview ${state === "recording" || state === "paused" ? "recording-active" : ""}`} />
                {recordedBlob && (
                    <video ref={videoPreviewRef} controls playsInline className="recorder-playback" />
                )}
                {(state === "recording" || state === "paused") && (
                    <div className="recorder-overlay">
                        <span className={`recorder-dot ${state === "recording" ? "blink" : ""}`} />
                        <span className="recorder-timer">{formatTime(recordingTime)}</span>
                    </div>
                )}
            </div>

            <div className="recorder-controls">
                {state === "ready" && (
                    <button className="btn btn-primary" onClick={startRecording}>
                        <span className="recorder-btn-icon">●</span> Record
                    </button>
                )}
                {state === "recording" && (
                    <>
                        <button className="btn btn-outline" onClick={pauseRecording}>
                            ⏸ Pause
                        </button>
                        <button className="btn btn-danger" onClick={stopRecording}>
                            <span className="recorder-btn-icon">■</span> Stop
                        </button>
                    </>
                )}
                {state === "paused" && (
                    <>
                        <button className="btn btn-primary" onClick={resumeRecording}>
                            ▶ Resume
                        </button>
                        <button className="btn btn-danger" onClick={stopRecording}>
                            <span className="recorder-btn-icon">■</span> Stop
                        </button>
                    </>
                )}
                {state === "preview" && (
                    <div className="recorder-actions">
                        <span className="recorder-size">{formatFileSize(recordedBlob?.size || 0)}</span>
                        <button className="btn btn-outline" onClick={() => { stopCamera(); setState("idle"); setRecordedBlob(null); }}>
                            Re-record
                        </button>
                        <button className="btn btn-primary" onClick={() => onRecordingComplete(recordedBlob)}>
                            Use This Recording
                        </button>
                    </div>
                )}
            </div>

            {state !== "preview" && state !== "idle" && (
                <div className="recorder-hint">
                    {state === "ready" && "Click Record to start"}
                    {state === "recording" && "Recording in progress..."}
                    {state === "paused" && "Recording paused"}
                </div>
            )}
        </div>
    );
}

function DropZone({ onFileSelect, currentFile, accept }) {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const previewUrl = useMemo(() => {
        if (!currentFile) return null;
        return URL.createObjectURL(currentFile);
    }, [currentFile]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) onFileSelect(file);
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) onFileSelect(file);
    };

    const ext = currentFile ? getFileExt(currentFile.name) : "";
    const mime = currentFile?.type || "";
    const isVideo = mime.startsWith("video/") || isVideoExt(ext);
    const isAudio = !isVideo && (mime.startsWith("audio/") || isAudioExt(ext));

    return (
        <div>
            <div
                className={`dropzone ${dragOver ? "dropzone-active" : ""} ${currentFile ? "dropzone-has-file" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !currentFile && inputRef.current?.click()}
            >
                <input ref={inputRef} type="file" accept={accept} onChange={handleChange} hidden />
                {currentFile ? (
                    <div className="dropzone-file">
                        {isVideo ? (
                            <video controls className="dropzone-video-preview" src={previewUrl} />
                        ) : isAudio ? (
                            <div className="dropzone-audio-preview">
                                <audio controls src={previewUrl} />
                            </div>
                        ) : (
                            <div className="dropzone-file-icon"><FileText size={32} /></div>
                        )}
                        <div className="dropzone-file-info">
                            <span className="dropzone-file-name" title={currentFile.name}>{truncateFilename(currentFile.name)}</span>
                            <span className="dropzone-file-size">{formatFileSize(currentFile.size)}</span>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onFileSelect(null); }}>
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="dropzone-empty">
                        <div className="dropzone-icon"><FolderOpen size={32} /></div>
                        <p>Drag & drop a file here, or click to browse</p>
                        <p className="dropzone-hint">Supports: MP4, WebM, MOV, MP3, WAV, M4A, PDF, DOC, PPT, images, and more (up to 500MB for video & audio)</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Material() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { role } = useAuth();
    const canManage = role === "Admin" || role === "Trainer";

    const [materials, setMaterials] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [lessonFilter, setLessonFilter] = useState(searchParams.get("lessonId") || "");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const { showToast, toastEl } = useToast();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [inputTab, setInputTab] = useState("upload");
    const [storage, setStorage] = useState(null);

    const [form, setForm] = useState(blankForm());

    useEffect(() => {
        loadMaterials();
        loadLessons();
        if (canManage) loadStorage();
    }, [page, lessonFilter]);

    const loadStorage = async () => {
        try {
            const res = await getStorageUsage();
            setStorage(res.data);
        } catch (err) { console.error(err); }
    };

    const loadMaterials = async () => {
        setLoading(true);
        try {
            if (lessonFilter) {
                const res = await getMaterialsByLesson(lessonFilter);
                setMaterials(Array.isArray(res.data) ? res.data : []);
                setTotalPages(1);
            } else {
                const res = await getMaterials(page);
                setMaterials(res.data.items);
                setTotalPages(res.data.totalPages);
            }
        } catch (err) {
            console.error(err);
            showToast("Couldn't load materials. Try refreshing.", "error");
        } finally {
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
        setInputTab("upload");
        setUploadProgress(null);
    };

    const openCreatePanel = () => {
        setEditingId(null);
        setForm(blankForm());
        setInputTab("upload");
        setUploadProgress(null);
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
        setInputTab(material.videoUrl && !material.filePath ? "url" : "upload");
        setUploadProgress(null);
        setPanelOpen(true);
    };

    const handleRecordingComplete = (blob) => {
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "video/webm" });
        setForm(prev => ({ ...prev, file, videoUrl: "" }));
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.lessonID) {
            showToast("Title and lesson are required.", "error");
            return;
        }

        if (editingId == null && !form.file && !form.videoUrl.trim()) {
            showToast("Please upload a file, record a video, or enter a video URL.", "error");
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
        setUploadProgress(0);

        try {
            if (editingId == null) {
                await createMaterial(data, (pct) => setUploadProgress(pct));
                showToast("Material created.", "success");
            } else {
                await updateMaterial(editingId, data, (pct) => setUploadProgress(pct));
                showToast("Material updated.", "success");
            }
            closePanel();
            if (page !== 1) { setPage(1); } else { loadMaterials(); }
            if (canManage) loadStorage();
        } catch (err) {
            console.error(err);
            showToast("Operation failed.", "error");
        } finally {
            setSaving(false);
            setUploadProgress(null);
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
                    showToast("Material deleted.", "success");
                    if (page !== 1) { setPage(1); } else { loadMaterials(); }
                    if (canManage) loadStorage();
                } catch (err) {
                    console.error(err);
                    showToast("Couldn't delete that material.", "error");
                }
            }
        });
    };

    const getStreamingUrl = (filePath) => getFileUrl(filePath);

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
            const ext = getFileExt(material.filePath);
            const streamingUrl = getStreamingUrl(material.filePath);
            if (isVideoExt(ext)) {
                return (
                    <div className="video-embed-container">
                        <video controls>
                            <source src={streamingUrl} type={`video/${ext === "mov" ? "quicktime" : ext}`} />
                            Your browser does not support video.
                        </video>
                    </div>
                );
            }
            if (isAudioExt(ext)) {
                const mimeMap = { mp3: "mpeg", wav: "wav", m4a: "mp4", flac: "flac", aac: "aac", ogg: "ogg" };
                return (
                    <div className="audio-embed-container">
                        <audio controls>
                            <source src={streamingUrl} type={`audio/${mimeMap[ext]}`} />
                            Your browser does not support audio.
                        </audio>
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
                <p>Upload files, record videos, and add video links to your lessons</p>
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
                                setPage(1);
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

            {storage && canManage && (
                <div className="card fade-in" style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                        <label style={{ margin: 0 }}>Storage Usage</label>
                        <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>
                            {formatFileSize(storage.usedBytes)} of {formatFileSize(storage.maxUserBytes)} used
                            <span style={{ marginLeft: 12 }}>· {formatFileSize(storage.maxFileBytes)} max per file</span>
                        </span>
                    </div>
                    <div className="upload-progress-bar">
                        <div
                            className="upload-progress-fill"
                            style={{
                                width: `${Math.min(100, (storage.usedBytes / storage.maxUserBytes) * 100)}%`,
                                background: storage.usedBytes / storage.maxUserBytes >= 0.9
                                    ? "var(--danger)"
                                    : undefined
                            }}
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading materials...
                </div>
            ) : materials.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon"><Paperclip size={32} /></div>
                    <p>
                        {lessonFilter
                            ? "No materials for this lesson yet."
                            : "No materials yet. Upload one to get started."}
                    </p>
                </div>
            ) : (
                <div className="materials-grid fade-in">
                    {materials.map(material => {
                        const preview = renderPreview(material);
                        const ext = getFileExt(material.filePath);
                        const hasVideo = !!material.videoUrl || (material.filePath && isVideoExt(ext));
                        const hasAudio = !hasVideo && material.filePath && isAudioExt(ext);

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
                                        {hasVideo && <span className="badge badge-neutral">Video</span>}
                                        {hasAudio && <span className="badge badge-info">Audio</span>}
                                    </div>
                                    <span className="pill pill-mc">{material.lessonTitle}</span>
                                    <div className="material-links">
                                        {material.filePath && (
                                            <a
                                                className="btn btn-outline btn-sm"
                                                href={getFileUrl(material.filePath)}
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

                {editingId == null && (
                    <div className="field" style={{ marginBottom: 16 }}>
                        <label>Content Source</label>
                        <div className="input-tabs">
                            <button
                                className={`input-tab ${inputTab === "upload" ? "active" : ""}`}
                                onClick={() => { setInputTab("upload"); setForm(prev => ({ ...prev, file: null, videoUrl: "" })); }}
                            >
                                <Upload size={16} style={{ verticalAlign: -2 }} /> Upload File
                            </button>
                            <button
                                className={`input-tab ${inputTab === "record" ? "active" : ""}`}
                                onClick={() => { setInputTab("record"); setForm(prev => ({ ...prev, file: null, videoUrl: "" })); }}
                            >
                                <Video size={16} style={{ verticalAlign: -2 }} /> Record Video
                            </button>
                            <button
                                className={`input-tab ${inputTab === "url" ? "active" : ""}`}
                                onClick={() => { setInputTab("url"); setForm(prev => ({ ...prev, file: null, videoUrl: "" })); }}
                            >
                                <Link size={16} style={{ verticalAlign: -2 }} /> Video URL
                            </button>
                        </div>
                    </div>
                )}

                {inputTab === "upload" && (
                    <div className="field" style={{ marginBottom: 16 }}>
                        <label>{editingId == null ? "Upload File" : "Replace File (optional)"}</label>
                        <DropZone
                            onFileSelect={(file) => setForm(prev => ({ ...prev, file, videoUrl: "" }))}
                            currentFile={form.file}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.rtf,.mp4,.webm,.ogg,.mov,.mp3,.wav,.m4a,.flac,.aac,.png,.jpg,.jpeg,.gif,.svg,.webp,.bmp"
                        />
                    </div>
                )}

                {inputTab === "record" && editingId == null && (
                    <div className="field" style={{ marginBottom: 16 }}>
                        <label>Record Video</label>
                        <VideoRecorder
                            onRecordingComplete={(blob) => {
                                const file = new File([blob], `recording-${Date.now()}.webm`, { type: "video/webm" });
                                setForm(prev => ({ ...prev, file, videoUrl: "" }));
                            }}
                        />
                        {form.file && form.file.name?.startsWith("recording-") && (
                            <div className="recorder-done">
                                <Check size={14} strokeWidth={2.5} style={{ color: "var(--success)", verticalAlign: -2 }} /> Recording ready: {form.file.name} ({formatFileSize(form.file.size)})
                            </div>
                        )}
                    </div>
                )}

                {inputTab === "url" && (
                    <div className="field" style={{ marginBottom: 16 }}>
                        <label>Video URL</label>
                        <input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={form.videoUrl}
                            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                        />
                        <small style={{ color: "var(--ink-soft)", fontSize: "12px", marginTop: 4, display: "block" }}>
                            Paste a YouTube, Vimeo, Google Drive, Loom, or direct video link.
                        </small>
                    </div>
                )}

                {uploadProgress !== null && (
                    <div className="upload-progress-wrap">
                        <div className="upload-progress-bar">
                            <div className="upload-progress-fill" style={{ width: `${Math.min(uploadProgress, 100)}%` }} />
                        </div>
                        <span className="upload-progress-text">
                            {uploadProgress < 100 ? `Uploading... ${Math.round(uploadProgress)}%` : "Processing..."}
                        </span>
                    </div>
                )}
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            {toastEl}
        </div>
    );
}

export default Material;
