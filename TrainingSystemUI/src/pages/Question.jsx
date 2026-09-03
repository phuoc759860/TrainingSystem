import { useEffect, useMemo, useState } from "react";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion
} from "../services/QuestionService";

import { getExams } from "../services/ExamService";
import TableSkeleton from "../components/TableSkeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import useToast from "../hooks/useToast";
import { Check, HelpCircle } from "lucide-react";
import SidePanel from "../components/SidePanel";

const blankQuestion = () => ({
    content: "",
    questionType: "MultipleChoice",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    score: 1,
    rubric: []
});

const isQuestionComplete = (q) => {
    if (!q.content.trim()) return false;
    if (q.questionType === "MultipleChoice") {
        return !!(q.optionA && q.optionB && q.correctAnswer);
    }
    return true;
};

function Question() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const preselectedExamId = searchParams.get("examId") || "";
    const initialCount = Number(searchParams.get("count")) || 0;

    const [questions, setQuestions] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [confirmState, setConfirmState] = useState(null);
    const { showToast, toastEl } = useToast();

    // Filter for the table / which exam we're managing
    const [filterExamId, setFilterExamId] = useState(preselectedExamId);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    // ---- Bulk create mode (triggered by ?examId=X&count=N from Exams.jsx) ----
    const [bulkMode, setBulkMode] = useState(initialCount > 1);
    const [bulkForms, setBulkForms] = useState(
        initialCount > 1 ? Array.from({ length: initialCount }, blankQuestion) : []
    );
    const [collapsed, setCollapsed] = useState(new Set());
    const [saving, setSaving] = useState(false);

    // ---- Single add/edit panel ----
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        examID: preselectedExamId,
        ...blankQuestion()
    });
    const [formSaving, setFormSaving] = useState(false);

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterExamId]);

    useEffect(() => {
        loadQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, filterExamId, page]);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const res = await getQuestions(filterExamId, page, 20, debouncedSearch);
            setQuestions(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch (err) {
            console.error(err);
            showToast("Couldn't load questions. Try refreshing.", "error");
        }
        finally {
            setLoading(false);
        }
    };

    const loadExams = async () => {
        const res = await getExams(1, 100);
        setExams(res.data.items);
    };

    // ---------------- Single panel form handlers ----------------

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleTypeChange = (e) => {
        setForm({
            ...form,
            questionType: e.target.value,
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctAnswer: "",
            rubric: []
        });
    };

    const closePanel = () => {
        setPanelOpen(false);
        setEditingId(null);
        setForm({ examID: filterExamId, ...blankQuestion() });
    };

    const openCreatePanel = () => {
        setEditingId(null);
        setForm({ examID: filterExamId, ...blankQuestion() });
        setPanelOpen(true);
    };

    const openEditPanel = (question) => {
        setEditingId(question.questionID);
        setForm({
            examID: question.examID,
            content: question.content,
            questionType: question.questionType,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer,
            score: question.score,
            rubric: question.rubric || []
        });
        setPanelOpen(true);
    };

    // -------- Rubric helpers (single panel) --------
    const addRubricCriterion = () => {
        setForm(prev => ({
            ...prev,
            rubric: [...(prev.rubric || []), { name: "", maxPoints: prev.score || 5 }]
        }));
    };

    const updateRubricCriterion = (index, field, value) => {
        setForm(prev => {
            const rubric = [...(prev.rubric || [])];
            rubric[index] = { ...rubric[index], [field]: value };
            return { ...prev, rubric };
        });
    };

    const removeRubricCriterion = (index) => {
        setForm(prev => ({
            ...prev,
            rubric: (prev.rubric || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        if (!form.content.trim()) {
            showToast("Question text is required.", "error");
            return;
        }
        if (!form.examID) {
            showToast("Please select an exam.", "error");
            return;
        }

        setFormSaving(true);

        try {
            const rubric = (form.rubric || [])
                .filter(r => r.name.trim())
                .map(r => ({ name: r.name.trim(), maxPoints: Number(r.maxPoints) || 0 }));

            const payload = {
                examID: form.examID,
                content: form.content,
                questionType: form.questionType,
                optionA: form.optionA,
                optionB: form.optionB,
                optionC: form.optionC,
                optionD: form.optionD,
                correctAnswer: form.correctAnswer,
                score: Number(form.score),
                rubric
            };

            if (editingId == null) {
                await createQuestion(payload);
                showToast("Question created.", "success");
            }
            else {
                await updateQuestion(editingId, payload);
                showToast("Question updated.", "success");
            }

            closePanel();
            loadQuestions();
        }
        catch (err) {
            console.error(err);
            showToast("Operation failed.", "error");
        }
        finally {
            setFormSaving(false);
        }
    };

    const handleDelete = (question) => {
        setConfirmState({
            title: "Delete this question?",
            message: "This can't be undone.",
            confirmLabel: "Delete question",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteQuestion(question.questionID);
                    showToast("Question deleted.", "success");
                    loadQuestions();
                }
                catch (err) {
                    console.error(err);
                    showToast("Couldn't delete that question.", "error");
                }
            }
        });
    };

    // ---------------- Bulk form handlers (unchanged — stays inline as a wizard) ----------------

    const handleBulkFieldChange = (index, field, value) => {
        setBulkForms(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleBulkTypeChange = (index, value) => {
        setBulkForms(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                questionType: value,
                optionA: "",
                optionB: "",
                optionC: "",
                optionD: "",
                correctAnswer: "",
                rubric: []
            };
            return updated;
        });
    };

    const handleBulkRubricChange = (index, field, value) => {
        setBulkForms(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addBulkRubricCriterion = (index) => {
        setBulkForms(prev => {
            const updated = [...prev];
            const rubric = [...(updated[index].rubric || [])];
            rubric.push({ name: "", maxPoints: Number(updated[index].score) || 5 });
            updated[index] = { ...updated[index], rubric };
            return updated;
        });
    };

    const updateBulkRubricCriterion = (index, criterionIndex, field, value) => {
        setBulkForms(prev => {
            const updated = [...prev];
            const rubric = [...(updated[index].rubric || [])];
            rubric[criterionIndex] = { ...rubric[criterionIndex], [field]: value };
            updated[index] = { ...updated[index], rubric };
            return updated;
        });
    };

    const removeBulkRubricCriterion = (index, criterionIndex) => {
        setBulkForms(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                rubric: (updated[index].rubric || []).filter((_, i) => i !== criterionIndex)
            };
            return updated;
        });
    };

    const toggleCollapsed = (index) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const completedCount = useMemo(
        () => bulkForms.filter(isQuestionComplete).length,
        [bulkForms]
    );

    const handleBulkSubmit = async () => {
        if (!filterExamId) {
            showToast("No exam selected.", "error");
            return;
        }

        const hasEmpty = bulkForms.some(q => q.content.trim() === "");
        if (hasEmpty) {
            setConfirmState({
                title: "Some questions are blank",
                message: "Save anyway? Blank questions will still be created.",
                confirmLabel: "Save anyway",
                onConfirm: () => runBulkSubmit()
            });
            return;
        }

        await runBulkSubmit();
    };

    const runBulkSubmit = async () => {
        setSaving(true);

        try {
            for (const q of bulkForms) {
                await createQuestion({
                    ...q,
                    examID: filterExamId,
                    score: Number(q.score) || 1
                });
            }

            showToast(`${bulkForms.length} question(s) created.`, "success");
            setBulkMode(false);
            setBulkForms([]);
            navigate(`/questions?examId=${filterExamId}`, { replace: true });
            loadQuestions();
        }
        catch (err) {
            console.error(err);
            showToast("Some questions failed to save. Check the list below.", "error");
            loadQuestions();
        }
        finally {
            setSaving(false);
        }
    };

    const cancelBulk = () => {
        setConfirmState({
            title: "Discard these questions?",
            message: "Anything you've typed in this batch will be lost.",
            confirmLabel: "Discard",
            danger: true,
            onConfirm: () => {
                setBulkMode(false);
                setBulkForms([]);
                navigate(`/questions${filterExamId ? `?examId=${filterExamId}` : ""}`, { replace: true });
            }
        });
    };

    const selectedExamTitle = exams.find(e => String(e.examID) === String(filterExamId))?.title;

    return (

        <div className="page">

            <div className="welcome-banner">
                <h2>Question Bank</h2>
                <p>Create and manage questions for your exams</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Questions</h2>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {!bulkMode && (
                        <button className="btn btn-primary" onClick={openCreatePanel}>
                            + New Question
                        </button>
                    )}
                </div>
            </div>

            {/* Exam selector — always visible, drives both the table and the panel's default exam */}
            <div className="card fade-in" style={{ marginBottom: 24 }}>
                <div className="form-grid">
                    <div className="field">
                        <label>Exam</label>
                        <select
                            value={filterExamId}
                            onChange={(e) => setFilterExamId(e.target.value)}
                        >
                            <option value="">All Exams</option>
                            {
                                exams.map(exam => (
                                    <option key={exam.examID} value={exam.examID}>
                                        {exam.title}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                </div>
            </div>

            {/* -------- Bulk fill-in wizard (only right after creating an exam) -------- */}
            {bulkMode && (
                <div className="card fade-in" style={{ marginBottom: 24 }}>
                    <h3 style={{ marginTop: 0 }}>
                        Add {bulkForms.length} Question{bulkForms.length > 1 ? "s" : ""}
                        {selectedExamTitle ? ` for "${selectedExamTitle}"` : ""}
                    </h3>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-soft)" }}>
                        <span>{completedCount} of {bulkForms.length} complete</span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${(completedCount / bulkForms.length) * 100}%` }}
                        />
                    </div>

                    {bulkForms.map((q, i) => {
                        const done = isQuestionComplete(q);
                        const isCollapsed = collapsed.has(i);

                        return (
                            <div
                                key={i}
                                className={`card bulk-question-card ${isCollapsed ? "collapsed" : ""}`}
                                style={{ marginBottom: 16, background: "var(--surface-alt)" }}
                            >
                                <div
                                    className="bulk-question-header"
                                    onClick={() => toggleCollapsed(i)}
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={!isCollapsed}
                                    aria-label={`Question ${i + 1} ${isCollapsed ? "expand" : "collapse"}`}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggleCollapsed(i);
                                        }
                                    }}
                                >
                                    <p style={{ fontWeight: 600, margin: 0 }}>
                                        <span className={`chip ${done ? "done" : ""}`}>
                                            {done ? <Check size={14} strokeWidth={2.5} style={{ color: "var(--success)", verticalAlign: -2 }} /> : i + 1}
                                        </span>
                                        Question {i + 1}
                                        {isCollapsed && q.content && (
                                            <span style={{ fontWeight: 400, color: "var(--ink-soft)", marginLeft: 8 }}>
                                                — {q.content.slice(0, 60)}{q.content.length > 60 ? "…" : ""}
                                            </span>
                                        )}
                                    </p>
                                    <span className={`chevron ${isCollapsed ? "" : "open"}`}>▾</span>
                                </div>

                                {!isCollapsed && (
                                    <div className="form-grid" style={{ marginTop: 14 }}>

                                        <div className="field">
                                            <label>Question Type</label>
                                            <select
                                                value={q.questionType}
                                                onChange={(e) => handleBulkTypeChange(i, e.target.value)}
                                            >
                                                <option value="MultipleChoice">Multiple Choice</option>
                                                <option value="Essay">Essay</option>
                                            </select>
                                        </div>

                                        <div className="field">
                                            <label>Score</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={q.score}
                                                onChange={(e) => handleBulkFieldChange(i, "score", e.target.value)}
                                            />
                                        </div>

                                        <div className="field" style={{ gridColumn: "1 / -1" }}>
                                            <label>Question</label>
                                            <textarea
                                                rows="2"
                                                placeholder="Question text"
                                                value={q.content}
                                                onChange={(e) => handleBulkFieldChange(i, "content", e.target.value)}
                                            />
                                        </div>

                                        {q.questionType === "MultipleChoice" && (
                                            <>
                                                <div className="field">
                                                    <label>Option A</label>
                                                    <input
                                                        value={q.optionA}
                                                        onChange={(e) => handleBulkFieldChange(i, "optionA", e.target.value)}
                                                    />
                                                </div>
                                                <div className="field">
                                                    <label>Option B</label>
                                                    <input
                                                        value={q.optionB}
                                                        onChange={(e) => handleBulkFieldChange(i, "optionB", e.target.value)}
                                                    />
                                                </div>
                                                <div className="field">
                                                    <label>Option C</label>
                                                    <input
                                                        value={q.optionC}
                                                        onChange={(e) => handleBulkFieldChange(i, "optionC", e.target.value)}
                                                    />
                                                </div>
                                                <div className="field">
                                                    <label>Option D</label>
                                                    <input
                                                        value={q.optionD}
                                                        onChange={(e) => handleBulkFieldChange(i, "optionD", e.target.value)}
                                                    />
                                                </div>
                                                <div className="field">
                                                    <label>Correct Answer</label>
                                                    <select
                                                        value={q.correctAnswer}
                                                        onChange={(e) => handleBulkFieldChange(i, "correctAnswer", e.target.value)}
                                                    >
                                                        <option value="">Select correct option</option>
                                                        <option value="A">A</option>
                                                        <option value="B">B</option>
                                                        <option value="C">C</option>
                                                        <option value="D">D</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        {q.questionType === "Essay" && (
                                            <>
                                                <div className="field" style={{ gridColumn: "1 / -1" }}>
                                                    <label>Model Answer / Grading Notes (optional)</label>
                                                    <textarea
                                                        rows="2"
                                                        placeholder="Optional notes for the grader — not shown to students"
                                                        value={q.correctAnswer}
                                                        onChange={(e) => handleBulkFieldChange(i, "correctAnswer", e.target.value)}
                                                    />
                                                </div>
                                                <div className="field" style={{ gridColumn: "1 / -1" }}>
                                                    <label>Grading Rubric (optional)</label>
                                                    {(q.rubric || []).map((criterion, ci) => (
                                                        <div key={ci} style={{
                                                            display: "flex", gap: 8, alignItems: "center",
                                                            marginBottom: 8
                                                        }}>
                                                            <input
                                                                placeholder="Criterion name"
                                                                value={criterion.name}
                                                                onChange={(e) => updateBulkRubricCriterion(i, ci, "name", e.target.value)}
                                                                style={{ flex: 1 }}
                                                            />
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="Max"
                                                                value={criterion.maxPoints}
                                                                onChange={(e) => updateBulkRubricCriterion(i, ci, "maxPoints", e.target.value)}
                                                                style={{ width: 70 }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm"
                                                                aria-label={`Remove rubric criterion ${ci + 1}`}
                                                                onClick={() => removeBulkRubricCriterion(i, ci)}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => addBulkRubricCriterion(i)}
                                                    >
                                                        + Add Criterion
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="sticky-actions">
                        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                            {completedCount} of {bulkForms.length} questions ready
                        </span>
                        <div>
                            <button className="btn btn-outline" onClick={cancelBulk} disabled={saving}>
                                Cancel
                            </button>{" "}
                            <button className="btn btn-primary" onClick={handleBulkSubmit} disabled={saving}>
                                {saving && <span className="spinner" />}
                                {saving ? "Saving..." : `Save All ${bulkForms.length} Questions`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <TableSkeleton rows={5} columns={6} />
            ) : questions.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon"><HelpCircle size={28} strokeWidth={1.7} /></div>
                    <p>
                        {search
                            ? "No questions match your search."
                            : filterExamId
                                ? "This exam doesn't have any questions yet."
                                : "No questions yet."}
                    </p>
                </div>
            ) : (
                <div className="table-scroll">
                <table className="table-modern fade-in">

                    <thead>
                        <tr>
                            <th>Exam</th>
                            <th>Question</th>
                            <th>Type</th>
                            <th>Correct</th>
                            <th>Score</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {
                            questions.map(question => (
                                <tr key={question.questionID}>
                                    <td>{question.examTitle}</td>
                                    <td>{question.content}</td>
                                    <td>
                                        <span className={`pill ${question.questionType === "MultipleChoice" ? "pill-mc" : "pill-essay"}`}>
                                            {question.questionType === "MultipleChoice" ? "Multiple Choice" : "Essay"}
                                        </span>
                                    </td>
                                    <td>{question.correctAnswer || "—"}</td>
                                    <td>{question.score}</td>
                                    <td style={{ whiteSpace: "nowrap" }}>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => openEditPanel(question)}
                                        >
                                            Edit
                                        </button>{" "}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(question)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>

                </table>
                </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Add Question" : "Edit Question"}
                subtitle={selectedExamTitle ? `For "${selectedExamTitle}"` : undefined}
                onClose={closePanel}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={closePanel} disabled={formSaving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={formSaving}>
                            {formSaving && <span className="spinner" />}
                            {editingId == null
                                ? (formSaving ? "Adding..." : "Add Question")
                                : (formSaving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Exam</label>
                    <select
                        name="examID"
                        value={form.examID}
                        onChange={handleChange}
                        disabled={editingId != null}
                    >
                        <option value="">Select Exam</option>
                        {
                            exams.map(exam => (
                                <option key={exam.examID} value={exam.examID}>
                                    {exam.title}
                                </option>
                            ))
                        }
                    </select>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Question Type</label>
                    <select
                        name="questionType"
                        value={form.questionType}
                        onChange={handleTypeChange}
                    >
                        <option value="MultipleChoice">Multiple Choice</option>
                        <option value="Essay">Essay</option>
                    </select>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Question</label>
                    <textarea
                        name="content"
                        rows="3"
                        placeholder="Question text"
                        value={form.content}
                        onChange={handleChange}
                        autoFocus
                    />
                </div>

                {form.questionType === "MultipleChoice" && (
                    <>
                        <div className="field" style={{ marginBottom: 16 }}>
                            <label>Option A</label>
                            <input name="optionA" placeholder="Option A" value={form.optionA} onChange={handleChange} />
                        </div>
                        <div className="field" style={{ marginBottom: 16 }}>
                            <label>Option B</label>
                            <input name="optionB" placeholder="Option B" value={form.optionB} onChange={handleChange} />
                        </div>
                        <div className="field" style={{ marginBottom: 16 }}>
                            <label>Option C</label>
                            <input name="optionC" placeholder="Option C" value={form.optionC} onChange={handleChange} />
                        </div>
                        <div className="field" style={{ marginBottom: 16 }}>
                            <label>Option D</label>
                            <input name="optionD" placeholder="Option D" value={form.optionD} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label>Correct Answer</label>
                            <select name="correctAnswer" value={form.correctAnswer} onChange={handleChange}>
                                <option value="">Select correct option</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </div>
                    </>
                )}

                {form.questionType === "Essay" && (
                    <>
                        <div className="field" style={{ marginBottom: 16 }}>
                            <label>Model Answer / Grading Notes (optional)</label>
                            <textarea
                                name="correctAnswer"
                                rows="3"
                                placeholder="Optional notes for the grader — not shown to students"
                                value={form.correctAnswer}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="field">
                            <label>Grading Rubric (optional)</label>
                            {(form.rubric || []).map((criterion, index) => (
                                <div key={index} style={{
                                    display: "flex", gap: 8, alignItems: "center",
                                    marginBottom: 8
                                }}>
                                    <input
                                        placeholder="Criterion name"
                                        value={criterion.name}
                                        onChange={(e) => updateRubricCriterion(index, "name", e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Max"
                                        value={criterion.maxPoints}
                                        onChange={(e) => updateRubricCriterion(index, "maxPoints", e.target.value)}
                                        style={{ width: 70 }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        aria-label={`Remove rubric criterion ${index + 1}`}
                                        onClick={() => removeRubricCriterion(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={addRubricCriterion}
                            >
                                + Add Criterion
                            </button>
                            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                                Trainers score each criterion when grading essay answers; the sum is the essay's grade.
                            </p>
                        </div>
                    </>
                )}
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            {toastEl}

        </div>

    );
}

export default Question;