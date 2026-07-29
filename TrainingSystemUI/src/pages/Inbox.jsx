import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInbox, getSentMessages, sendMessage, markMessageRead, deleteMessage } from "../services/MessageService";
import { getRecipients } from "../services/UserService";
import SidePanel from "../components/SidePanel";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";

function Inbox() {
    const navigate = useNavigate();
    const [tab, setTab] = useState("inbox");
    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmState, setConfirmState] = useState(null);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [form, setForm] = useState({ receiverID: "", subject: "", body: "" });

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === "inbox") {
                const res = await getInbox();
                setInbox(res.data);
            } else {
                const res = await getSentMessages();
                setSent(res.data);
            }
        } catch {
            setToast({ message: "Could not load messages.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const openCompose = async () => {
        const res = await getRecipients();
        setUsers(res.data);
        setForm({ receiverID: "", subject: "", body: "" });
        setPanelOpen(true);
    };

    const handleSend = async () => {
        if (!form.receiverID || !form.subject.trim() || !form.body.trim()) {
            setToast({ message: "All fields required.", type: "error" });
            return;
        }
        setSaving(true);
        try {
            await sendMessage({
                receiverID: Number(form.receiverID),
                subject: form.subject,
                body: form.body
            });
            setToast({ message: "Message sent!", type: "success" });
            setPanelOpen(false);
            loadData();
        } catch {
            setToast({ message: "Failed to send.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const openMessage = async (msg) => {
        setSelectedMsg(msg);
        if (!msg.isRead && tab === "inbox") {
            try {
                await markMessageRead(msg.messageID);
                setInbox(prev => prev.map(m => m.messageID === msg.messageID ? { ...m, isRead: true } : m));
            } catch { /* ok */ }
        }
    };

    const handleDelete = (msg) => {
        setConfirmState({
            title: "Delete message?",
            message: "This can't be undone.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteMessage(msg.messageID);
                    setToast({ message: "Deleted.", type: "success" });
                    loadData();
                    if (selectedMsg?.messageID === msg.messageID) setSelectedMsg(null);
                } catch {
                    setToast({ message: "Failed to delete.", type: "error" });
                }
            }
        });
    };

    const messages = tab === "inbox" ? inbox : sent;
    const unread = inbox.filter(m => !m.isRead).length;

    if (selectedMsg) {
        return (
            <div className="page">
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedMsg(null)} style={{ marginBottom: 16 }}>
                    &larr; Back to {tab}
                </button>
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>{selectedMsg.subject}</h3>
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
                        {tab === "inbox" ? `From: ${selectedMsg.senderName}` : `To: ${selectedMsg.receiverName}`}
                        &middot; {new Date(selectedMsg.sentAt).toLocaleString()}
                    </p>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{selectedMsg.body}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedMsg)} style={{ marginTop: 12 }}>
                    Delete
                </button>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="welcome-banner">
                <h2>Messages</h2>
                <p>Communicate with trainers and students</p>
            </div>

            <div className="page-header">
                <div style={{ display: "flex", gap: 8 }}>
                    <button className={`btn btn-sm ${tab === "inbox" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("inbox")}>
                        Inbox {unread > 0 && <span className="badge badge-danger" style={{ marginLeft: 6, fontSize: 11 }}>{unread}</span>}
                    </button>
                    <button className={`btn btn-sm ${tab === "sent" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("sent")}>
                        Sent
                    </button>
                </div>
                <button className="btn btn-primary" onClick={openCompose}>+ Compose</button>
            </div>

            {loading ? (
                <div className="loading-row"><span className="spinner" /> Loading...</div>
            ) : messages.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">&#128231;</div>
                    <p>{tab === "inbox" ? "No messages yet." : "No sent messages."}</p>
                </div>
            ) : (
                messages.map(msg => (
                    <div
                        key={msg.messageID}
                        className="card"
                        style={{
                            marginBottom: 8, cursor: "pointer", padding: "14px 20px",
                            borderLeft: !msg.isRead && tab === "inbox" ? "4px solid var(--brand)" : "4px solid transparent"
                        }}
                        onClick={() => openMessage(msg)}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontWeight: tab === "inbox" && !msg.isRead ? 700 : 500 }}>
                                    {msg.subject}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                                    {tab === "inbox" ? msg.senderName : msg.receiverName} &middot; {new Date(msg.sentAt).toLocaleDateString()}
                                </div>
                            </div>
                            <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(msg); }}>
                                &times;
                            </button>
                        </div>
                    </div>
                ))
            )}

            <SidePanel
                open={panelOpen}
                title="Compose Message"
                onClose={() => setPanelOpen(false)}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setPanelOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSend} disabled={saving}>
                            {saving ? "Sending..." : "Send"}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>To</label>
                    <select value={form.receiverID} onChange={(e) => setForm({ ...form, receiverID: e.target.value })}>
                        <option value="">Select user</option>
                        {users.map(u => (
                            <option key={u.userID} value={u.userID}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Subject</label>
                    <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" />
                </div>
                <div className="field">
                    <label>Message</label>
                    <textarea rows="8" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your message..." />
                </div>
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            <Toast toast={toast} onDone={() => setToast(null)} />
        </div>
    );
}

export default Inbox;
