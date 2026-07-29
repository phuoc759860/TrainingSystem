import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMaterialsByLesson } from "../services/MaterialService";
import { getLesson } from "../services/LessonService";
import {
    startTracking,
    updateProgress,
    markViewed,
    getViewedMaterials
} from "../services/LessonProgressService";
import { getQuizzes } from "../services/QuizService";
import * as pdfjsLib from "pdfjs-dist";
import Toast from "../components/Toast";
import { API_BASE, FILE_HOST } from "../api/axios";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function getEmbedUrl(url) {
    if (!url) return null;
    const trimmed = url.trim();
    const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return trimmed;
}

function getExt(filePath) {
    if (!filePath) return "";
    return filePath.split(".").pop().toLowerCase();
}

function isVideoFile(ext) {
    return ["mp4", "webm", "ogg", "mov"].includes(ext);
}

function isImageFile(ext) {
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
}

function isPdfFile(ext) {
    return ext === "pdf";
}

function isOfficeFile(ext) {
    return ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext);
}

function isAudioFile(ext) {
    return ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext);
}

function getFileIcon(ext) {
    if (isPdfFile(ext)) return { icon: "PDF", color: "#e74c3c", bg: "#fdecea" };
    if (isOfficeFile(ext)) {
        if (["doc", "docx"].includes(ext)) return { icon: "DOC", color: "#2b579a", bg: "#e8eef7" };
        if (["ppt", "pptx"].includes(ext)) return { icon: "PPT", color: "#d04423", bg: "#fde8e4" };
        if (["xls", "xlsx"].includes(ext)) return { icon: "XLS", color: "#207245", bg: "#e6f4ec" };
    }
    if (isImageFile(ext)) return { icon: "IMG", color: "#8e44ad", bg: "#f3e8f9" };
    if (isAudioFile(ext)) return { icon: "AUD", color: "#e67e22", bg: "#fdf0e2" };
    if (isVideoFile(ext)) return { icon: "VID", color: "#e74c3c", bg: "#fdecea" };
    return { icon: "FILE", color: "#7f8c8d", bg: "#f0f0f0" };
}

function PdfViewer({ url, title, initialPage, onPageChange }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(initialPage || 1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pdfDocRef = useRef(null);
    const pageRef = useRef(null);

            const renderPage = useCallback(async (pageNum) => {
        if (!pdfDocRef.current) return;
        try {
            const page = await pdfDocRef.current.getPage(pageNum);
            pageRef.current = page;
            const canvas = canvasRef.current;
            if (!canvas) return;

            const unscaledViewport = page.getViewport({ scale: 1 });
            const container = containerRef.current;
            const containerWidth = container ? container.clientWidth - 32 : 800;
            const fitScale = containerWidth / unscaledViewport.width;
            const finalScale = fitScale;

            const viewport = page.getViewport({ scale: finalScale });
            const dpr = window.devicePixelRatio || 1;
            canvas.height = viewport.height * dpr;
            canvas.width = viewport.width * dpr;
            canvas.style.width = viewport.width + "px";
            canvas.style.height = viewport.height + "px";
            const ctx = canvas.getContext("2d");
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            await page.render({ canvasContext: ctx, viewport }).promise;
            setScale(Math.round(finalScale * 100));
            if (onPageChange) onPageChange(pageNum);
        } catch (err) {
            console.error("PDF render error:", err);
        }
    }, [onPageChange]);

    useEffect(() => {
        let cancelled = false;
        const loadPdf = async () => {
            try {
                console.log("[PDF] Loading from:", url);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.arrayBuffer();
                if (cancelled) return;
                const doc = await pdfjsLib.getDocument({ data }).promise;
                if (cancelled) return;
                pdfDocRef.current = doc;
                setTotalPages(doc.numPages);
                setCurrentPage(1);
                setLoading(false);
            } catch (err) {
                console.error("[PDF] Load error:", err);
                if (!cancelled) {
                    setError(`Failed to load PDF: ${err.message || err}`);
                    setLoading(false);
                }
            }
        };
        loadPdf();
        return () => { cancelled = true; };
    }, [url]);

    useEffect(() => {
        if (!loading && pdfDocRef.current) {
            renderPage(currentPage);
        }
    }, [currentPage, loading, renderPage]);

    useEffect(() => {
        if (loading || !pdfDocRef.current) return;
        const onResize = () => renderPage(currentPage);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [loading, currentPage, renderPage]);

    if (loading) return <div className="viewer-doc-loading"><span className="spinner" /> Loading PDF...</div>;
    if (error) return <div className="viewer-doc-error"><div style={{textAlign:"center",maxWidth:480}}><p style={{fontWeight:700,marginBottom:8}}>{error}</p><a className="btn btn-outline btn-sm" href={url} target="_blank" rel="noreferrer">Open PDF in new tab</a></div></div>;

    return (
        <div className="viewer-pdf-rendered" ref={containerRef}>
            <div className="viewer-pdf-toolbar">
                <button className="btn btn-outline btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                    ← Prev
                </button>
                <span className="viewer-pdf-pageinfo">
                    Page {currentPage} of {totalPages}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                    Next →
                </button>
                <span className="viewer-pdf-pageinfo" style={{ marginLeft: 8 }}>
                    {scale}% fit
                </span>
                <a className="btn btn-outline btn-sm" href={url} target="_blank" rel="noreferrer" style={{ marginLeft: "auto" }}>
                    Open in Tab
                </a>
            </div>
            <div className="viewer-pdf-canvas-wrap">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}

function OfficeViewer({ url, title }) {
    const ext = getExt(url);
    const isWord = ["doc", "docx"].includes(ext);
    const isPpt = ["ppt", "pptx"].includes(ext);
    const isXls = ["xls", "xlsx"].includes(ext);
    const officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    const googleViewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

    return (
        <div className="viewer-office">
            <div className="viewer-office-tabs">
                <span className="viewer-office-label">
                    {isWord ? "Word Document" : isPpt ? "PowerPoint Presentation" : "Excel Spreadsheet"}
                </span>
                <div className="viewer-office-actions">
                    <a className="btn btn-outline btn-sm" href={officeEmbedUrl} target="_blank" rel="noreferrer">
                        Open with Office Online
                    </a>
                    <a className="btn btn-outline btn-sm" href={url} target="_blank" rel="noreferrer">
                        Open in Tab
                    </a>
                </div>
            </div>
            <iframe className="viewer-office-iframe" src={officeEmbedUrl} title={title} />
            <div className="viewer-office-fallback">
                <p>If the document doesn't load, try opening it with Office Online or download it directly.</p>
                <a className="btn btn-primary btn-sm" href={url} target="_blank" rel="noreferrer" download>
                    Download {title}
                </a>
            </div>
        </div>
    );
}

function ImageViewer({ url, title }) {
    const [zoom, setZoom] = useState(false);
    return (
        <div className={`viewer-image-wrap ${zoom ? "zoomed" : ""}`} onClick={() => setZoom(!zoom)}>
            <img src={url} alt={title} className="viewer-image" />
            <div className="viewer-image-hint">{zoom ? "Click to fit" : "Click to zoom"}</div>
        </div>
    );
}

function AudioPlayer({ url, title }) {
    return (
        <div className="viewer-audio">
            <div className="viewer-audio-icon">♫</div>
            <h3>{title}</h3>
            <audio controls autoPlay className="viewer-audio-ctrl">
                <source src={url} />
            </audio>
        </div>
    );
}

function LessonViewer() {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [viewedIds, setViewedIds] = useState(new Set());
    const [viewedPages, setViewedPages] = useState({});
    const [activeIndex, setActiveIndex] = useState(0);
    const [progressId, setProgressId] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [lessonQuiz, setLessonQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [toast, setToast] = useState(null);
    const currentPageRef = useRef(1);
    const pendingUpdateRef = useRef(null);

    const loadLesson = useCallback(async () => {
        try {
            const res = await getLesson(lessonId);
            setLesson(res.data);
        } catch {
            setToast({ message: "Couldn't load lesson.", type: "error" });
        }
    }, [lessonId]);

    const loadMaterials = useCallback(async () => {
        try {
            const res = await getMaterialsByLesson(lessonId);
            setMaterials(res.data);
        } catch {
            setToast({ message: "Couldn't load materials.", type: "error" });
        }
    }, [lessonId]);

    const loadViewed = useCallback(async () => {
        try {
            const res = await getViewedMaterials(lessonId);
            const data = res.data;
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
                setViewedIds(new Set(data.map(v => v.materialID)));
                const pages = {};
                data.forEach(v => { pages[v.materialID] = v.lastPage; });
                setViewedPages(pages);
            } else {
                setViewedIds(new Set(data));
            }
        } catch { }
    }, [lessonId]);

    const startTrackingLesson = useCallback(async () => {
        try {
            const res = await startTracking({ lessonID: parseInt(lessonId), courseID: lesson?.courseID || 0 });
            setProgressId(res.data.lessonProgressID);
            setIsCompleted(res.data.isCompleted || false);
        } catch (err) {
            console.error("[LessonViewer] startTracking failed:", err?.response?.data || err.message);
            setToast({ message: "Could not start progress tracking.", type: "error" });
        }
    }, [lessonId, lesson]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([loadLesson(), loadMaterials(), loadViewed()]);
            setLoading(false);
        };
        init();
    }, [loadLesson, loadMaterials, loadViewed]);

    useEffect(() => {
        if (lesson) {
            startTrackingLesson();
            getQuizzes("", "").then(res => {
                const quiz = res.data.find(q => q.lessonID === parseInt(lessonId));
                setLessonQuiz(quiz || null);
            }).catch(() => { });
        }
    }, [lesson, lessonId, startTrackingLesson]);

    useEffect(() => {
        if (materials.length > 0 && !loading) {
            const current = materials[activeIndex];
            if (current && !viewedIds.has(current.materialID)) {
                markViewed(current.materialID, currentPageRef.current);
                setViewedIds(prev => new Set([...prev, current.materialID]));
                setViewedPages(prev => ({ ...prev, [current.materialID]: currentPageRef.current }));
                if (progressId) {
                    if (pendingUpdateRef.current) {
                        pendingUpdateRef.current.then(() => {
                            pendingUpdateRef.current = updateProgress(progressId, { lastMaterialID: current.materialID });
                        });
                    } else {
                        pendingUpdateRef.current = updateProgress(progressId, { lastMaterialID: current.materialID });
                    }
                }
            }
        }
    }, [activeIndex, materials, loading, progressId, viewedIds]);

    const handleMaterialClick = async (index) => {
        const mat = materials[index];
        const page = currentPageRef.current;

        await markViewed(mat.materialID, page);
        setViewedIds(prev => new Set([...prev, mat.materialID]));
        setViewedPages(prev => ({ ...prev, [mat.materialID]: page }));

        if (progressId) {
            await updateProgress(progressId, { lastMaterialID: mat.materialID });
        }

        setActiveIndex(index);
    };

    const handleMarkComplete = async () => {
        if (!progressId) {
            setToast({ message: "Progress tracking not initialized. Please refresh.", type: "error" });
            return;
        }
        setCompleting(true);
        try {
            if (pendingUpdateRef.current) {
                await pendingUpdateRef.current;
                pendingUpdateRef.current = null;
            }
            const res = await updateProgress(progressId, { isCompleted: true });
            setIsCompleted(true);
            setToast({ message: "Lesson marked as complete!", type: "success" });
        } catch (err) {
            console.error("[LessonViewer] markComplete failed:", err?.response?.data || err.message);
            setToast({ message: "Failed to mark complete. Try again.", type: "error" });
        } finally {
            setCompleting(false);
        }
    };

    const handlePrev = () => {
        if (activeIndex > 0) handleMaterialClick(activeIndex - 1);
    };

    const handleNext = () => {
        if (activeIndex < materials.length - 1) handleMaterialClick(activeIndex + 1);
    };

    const viewedCount = materials.filter(m => viewedIds.has(m.materialID)).length;
    const progressPercent = materials.length > 0 ? Math.round((viewedCount / materials.length) * 100) : 0;
    const currentMaterial = materials[activeIndex];

    const renderContent = (material) => {
        if (!material) return <div className="viewer-empty">No material selected</div>;

        const ext = getExt(material.filePath);
        const fullUrl = material.filePath ? `${FILE_HOST}${material.filePath}` : null;

        // Video URL (YouTube/Vimeo)
        if (material.videoUrl) {
            const embedUrl = getEmbedUrl(material.videoUrl);
            if (embedUrl) {
                return (
                    <div className="viewer-video">
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
            if (/\.(mp4|webm|ogg|mov)$/i.test(material.videoUrl.trim())) {
                return (
                    <div className="viewer-video">
                        <video controls autoPlay>
                            <source src={material.videoUrl.trim()} />
                        </video>
                    </div>
                );
            }
        }

        // PDF
        if (fullUrl && isPdfFile(ext)) {
            return <PdfViewer
                url={fullUrl}
                title={material.title}
                initialPage={viewedPages[material.materialID] || 1}
                onPageChange={(page) => { currentPageRef.current = page; }}
            />;
        }

        // Office documents
        if (fullUrl && isOfficeFile(ext)) {
            return <OfficeViewer url={fullUrl} title={material.title} />;
        }

        // Images
        if (fullUrl && isImageFile(ext)) {
            return <ImageViewer url={fullUrl} title={material.title} />;
        }

        // Audio
        if (fullUrl && isAudioFile(ext)) {
            return <AudioPlayer url={fullUrl} title={material.title} />;
        }

        // Video files
        if (fullUrl && isVideoFile(ext)) {
            // Use streaming endpoint for range request support (better seeking)
            const streamingUrl = material.filePath
                ? `${API_BASE}/Streaming/uploads${material.filePath.replace(/^\/uploads/, "")}`
                : fullUrl;
            return (
                <div className="viewer-video">
                    <video controls autoPlay preload="metadata">
                        <source src={streamingUrl} type={`video/${ext === "mov" ? "quicktime" : ext}`} />
                        Your browser does not support video.
                    </video>
                </div>
            );
        }

        // Generic file
        if (fullUrl) {
            const fi = getFileIcon(ext);
            return (
                <div className="viewer-file-card">
                    <div className="viewer-file-badge" style={{ background: fi.bg, color: fi.color }}>
                        {fi.icon}
                    </div>
                    <div className="viewer-file-details">
                        <h3 className="viewer-file-name">{material.title}</h3>
                        <p className="viewer-file-meta">
                            {ext.toUpperCase()} file • {material.filePath.split("/").pop()}
                        </p>
                        <div className="viewer-file-btns">
                            <a className="btn btn-primary btn-sm" href={fullUrl} target="_blank" rel="noreferrer">
                                Open in Browser
                            </a>
                            <a className="btn btn-outline btn-sm" href={fullUrl} download>
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        // No content
        const fi = getFileIcon("");
        return (
            <div className="viewer-file-card">
                <div className="viewer-file-badge" style={{ background: fi.bg, color: fi.color }}>
                    {fi.icon}
                </div>
                <div className="viewer-file-details">
                    <h3 className="viewer-file-name">{material.title}</h3>
                    <p className="viewer-file-meta">No content attached to this material.</p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading-row">
                    <span className="spinner" /> Loading lesson...
                </div>
            </div>
        );
    }

    return (
        <div className="lesson-viewer">
            <div className="viewer-sidebar">
                <div className="viewer-sidebar-header">
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h3>{lesson?.title || "Lesson"}</h3>
                    <p className="viewer-course-name">{lesson?.courseTitle}</p>
                </div>

                <div className="viewer-progress-section">
                    <div className="viewer-progress-bar">
                        <div className="viewer-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span className="viewer-progress-text">
                        {viewedCount}/{materials.length} materials ({progressPercent}%)
                    </span>
                </div>

                <div className="viewer-materials-list">
                    {materials.map((mat, idx) => {
                        const ext = getExt(mat.filePath);
                        const fi = mat.videoUrl
                            ? { icon: "VID", color: "#e74c3c", bg: "#fdecea" }
                            : getFileIcon(ext);
                        return (
                            <div
                                key={mat.materialID}
                                className={`viewer-material-item ${idx === activeIndex ? "active" : ""} ${viewedIds.has(mat.materialID) ? "viewed" : ""}`}
                                onClick={() => handleMaterialClick(idx)}
                            >
                                <div className="viewer-material-check">
                                    {viewedIds.has(mat.materialID) ? "✓" : (idx + 1)}
                                </div>
                                <div className="viewer-material-info">
                                    <span className="viewer-material-title">{mat.title}</span>
                                    <span className="viewer-material-type" style={{ color: fi.color }}>
                                        {mat.videoUrl ? "Video" : fi.icon !== "FILE" ? fi.icon : "File"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {isCompleted ? (
                    <div style={{ padding: "0 16px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", color: "var(--success)", fontWeight: 700, fontSize: 14 }}>
                            ✓ Lesson Complete
                        </div>
                    </div>
                ) : progressPercent === 100 ? (
                    <div style={{ padding: "0 16px 8px" }}>
                        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleMarkComplete} disabled={completing}>
                            {completing ? "Marking..." : "Mark Lesson Complete"}
                        </button>
                    </div>
                ) : null}

                {lessonQuiz && (
                    <div style={{ padding: "0 16px 16px" }}>
                        {isCompleted && (
                            <p style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, margin: "0 0 6px", textAlign: "center" }}>
                                Ready to test your knowledge?
                            </p>
                        )}
                        <button
                            className={isCompleted ? "btn btn-primary" : "btn btn-outline"}
                            style={{ width: "100%" }}
                            onClick={() => navigate(`/quizzes/${lessonQuiz.quizID}/take`)}
                        >
                            {isCompleted ? "Start Quiz" : `Quiz: ${lessonQuiz.title}`}
                        </button>
                    </div>
                )}
            </div>

            <div className="viewer-main">
                {currentMaterial && (
                    <div className="viewer-content-header">
                        <div className="viewer-content-header-left">
                            <h2>{currentMaterial.title}</h2>
                            {currentMaterial.filePath && (
                                <span className="viewer-file-pill">
                                    {getExt(currentMaterial.filePath).toUpperCase() || "FILE"}
                                </span>
                            )}
                        </div>
                        <div className="viewer-nav-buttons">
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={handlePrev}
                                disabled={activeIndex === 0}
                            >
                                ← Previous
                            </button>
                            <span className="viewer-page-num">
                                {activeIndex + 1} / {materials.length}
                            </span>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={handleNext}
                                disabled={activeIndex === materials.length - 1}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
                <div className="viewer-content-body">
                    {renderContent(currentMaterial)}
                </div>
            </div>

            <Toast toast={toast} onDone={() => setToast(null)} />
        </div>
    );
}

export default LessonViewer;
