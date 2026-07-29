import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getExamResults, createExamResult, updateExamResult, deleteExamResult } from "../services/ExamResultService";
import { getUsers } from "../services/UserService";
import { getExams } from "../services/ExamService";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import SidePanel from "../components/SidePanel";
import Pagination from "../components/Pagination";

const blankForm = () => ({ userID: "", examID: "", score: "" });

function ExamResult() {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [users, setUsers] = useState([]);
    const [exams, setExams] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState(blankForm());
    const [search, setSearch] = useState("");
    const [gradingFilter, setGradingFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => { loadResults(); loadUsers(); loadExams(); }, [page]);

    const loadResults = async () => {
        setLoading(true);
        try {
            const res = await getExamResults(page);
            setResults(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch {
            setToast({ message: "Couldn't load exam results. Try refreshing.", type: "error" });
        }
        finally {
            setLoading(false);
        }
    };
    const loadUsers = async () => setUsers((await getUsers(1, 100)).data.items);
    const loadExams = async () => setExams((await getExams(1, 100)).data.items);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

    const openEditPanel = (r) => {
        setEditingId(r.resultID);
        setForm({ userID: r.userID, examID: r.examID, score: r.score });
        setPanelOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.userID || !form.examID || form.score === "") {
            setToast({ message: "User, exam, and score are required.", type: "error" });
            return;
        }

        setSaving(true);

        try {
            const data = { userID: Number(form.userID), examID: Number(form.examID), score: Number(form.score) };
            if (editingId == null) {
                await createExamResult(data);
                setToast({ message: "Result created.", type: "success" });
            }
            else {
                await updateExamResult(editingId, data);
                setToast({ message: "Result updated.", type: "success" });
            }
            closePanel();
            loadResults();
        } catch (err) {
            console.log(err.response?.data);
            setToast({ message: "Operation failed.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (r) => {
        setConfirmState({
            title: "Delete this result?",
            message: "This can't be undone.",
            confirmLabel: "Delete result",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteExamResult(r.resultID);
                    setToast({ message: "Result deleted.", type: "success" });
                    loadResults();
                }
                catch {
                    setToast({ message: "Couldn't delete that result.", type: "error" });
                }
            }
        });
    };

    const filteredResults = useMemo(() => {
        let list = results;
        if (gradingFilter === "needsGrading") list = list.filter(r => r.needsGrading);
        else if (gradingFilter === "graded") list = list.filter(r => !r.needsGrading);
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter(r =>
            r.userName?.toLowerCase().includes(q) ||
            r.examTitle?.toLowerCase().includes(q)
        );
    }, [results, search, gradingFilter]);

    return (
        <div className="page">

            <div className="welcome-banner">
                <h2>Exam Results</h2>
                <p>View and manage exam submissions and grades</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Results</h2>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <select
                        className="search-input"
                        value={gradingFilter}
                        onChange={(e) => setGradingFilter(e.target.value)}
                    >
                        <option value="all">All Results</option>
                        <option value="needsGrading">Needs Grading</option>
                        <option value="graded">Graded</option>
                    </select>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by user or exam..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={openCreatePanel}>
                        + New Result
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading results...
                </div>
            ) : filteredResults.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📊</div>
                    <p>
                        {search || gradingFilter !== "all"
                            ? "No results match your filters."
                            : "No exam results yet."}
                    </p>
                </div>
            ) : (
                <table className="table-modern fade-in">
                    <thead><tr><th>User</th><th>Exam</th><th>Score</th><th>Status</th><th>Grading</th><th>Submitted</th><th></th></tr></thead>
                    <tbody>
                        {filteredResults.map(r => (
                            <tr key={r.resultID}>
                                <td style={{ fontWeight: 500 }}>{r.userName}</td><td>{r.examTitle}</td><td>{r.score}</td>
                                <td><span className={`badge ${r.passed ? "badge-success" : "badge-danger"}`}>{r.passed ? "Passed" : "Failed"}</span></td>
                                <td>
                                    {r.needsGrading
                                        ? <span className="badge badge-danger">Needs Grading</span>
                                        : <span className="badge badge-success">Graded</span>}
                                </td>
                                <td>{new Date(r.submittedAt).toLocaleString()}</td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/exam-results/${r.resultID}/grade`)}>
                                        {r.needsGrading ? "Grade" : "View"}
                                    </button>{" "}
                                    <button className="btn btn-outline btn-sm" onClick={() => openEditPanel(r)}>Edit</button>{" "}
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Add Result" : "Edit Result"}
                subtitle={editingId != null ? "Manually adjusting a submitted result" : undefined}
                onClose={closePanel}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={closePanel} disabled={saving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving && <span className="spinner" />}
                            {editingId == null
                                ? (saving ? "Adding..." : "Add Result")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>User</label>
                    <select name="userID" value={form.userID} onChange={handleChange}>
                        <option value="">Select User</option>
                        {users.map(u => <option key={u.userID} value={u.userID}>{u.name}</option>)}
                    </select>
                </div>
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Exam</label>
                    <select name="examID" value={form.examID} onChange={handleChange}>
                        <option value="">Select Exam</option>
                        {exams.map(e => <option key={e.examID} value={e.examID}>{e.title}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label>Score</label>
                    <input type="number" name="score" min="0" max="100" placeholder="0–100" value={form.score} onChange={handleChange} />
                </div>
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            <Toast toast={toast} onDone={() => setToast(null)} />
        </div>
    );
}
export default ExamResult;