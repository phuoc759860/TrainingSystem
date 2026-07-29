import { useEffect, useState, useMemo } from "react";
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} from "../services/UserService";
import { getRoles } from "../services/RoleService";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import SidePanel from "../components/SidePanel";
import Pagination from "../components/Pagination";

const blankForm = () => ({
    name: "",
    email: "",
    password: "",
    roleID: ""
});

function User() {

    const [users, setUsers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [form, setForm] = useState(blankForm());

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, [page]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await getUsers(page);
            setUsers(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch {
            setToast({ message: "Couldn't load users. Try refreshing.", type: "error" });
        }
        finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        const res = await getRoles();
        setRoles(res.data);
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
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

    const openEditPanel = (user) => {
        setEditingId(user.userID);
        setForm({
            name: user.name,
            email: user.email,
            password: "",
            roleID: user.roleID
        });
        setPanelOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.roleID) {
            setToast({ message: "Name, email, and role are required.", type: "error" });
            return;
        }
        if (editingId == null && !form.password) {
            setToast({ message: "Password is required for new users.", type: "error" });
            return;
        }

        setSaving(true);

        try {

            if (editingId == null) {
                await createUser(form);
                setToast({ message: "User created.", type: "success" });
            }
            else {
                await updateUser(editingId, form);
                setToast({ message: "User updated.", type: "success" });
            }

            closePanel();
            loadUsers();

        }
        catch (err) {
            console.log(err);
            setToast({ message: "Operation failed.", type: "error" });
        }
        finally {
            setSaving(false);
        }

    };

    const handleDelete = (user) => {
        setConfirmState({
            title: `Delete "${user.name}"?`,
            message: "This removes the user's account and access. This can't be undone.",
            confirmLabel: "Delete user",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteUser(user.userID);
                    setToast({ message: "User deleted.", type: "success" });
                    loadUsers();
                }
                catch (err) {
                    const msg = err?.response?.data?.message || err?.response?.data?.title || "Couldn't delete that user.";
                    setToast({ message: msg, type: "error" });
                }
            }
        });
    };

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.roleName?.toLowerCase().includes(q)
        );
    }, [users, search]);

    return (

        <div className="page">

            <div className="welcome-banner">
                <h2>User Management</h2>
                <p>Manage user accounts and permissions</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Users</h2>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={openCreatePanel}>
                        + New User
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading users...
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">👤</div>
                    <p>
                        {search
                            ? "No users match your search."
                            : "No users yet. Create one to get started."}
                    </p>
                </div>
            ) : (
                <table className="table-modern fade-in">

                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {
                            filteredUsers.map(user => (
                                <tr key={user.userID}>
                                    <td style={{ fontWeight: 500 }}>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className="pill pill-mc">{user.roleName}</span></td>
                                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => openEditPanel(user)}
                                        >
                                            Edit
                                        </button>{" "}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(user)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>

                </table>
            )}

            {!loading && totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Add User" : "Edit User"}
                subtitle={editingId != null ? `Editing "${form.name}"` : undefined}
                onClose={closePanel}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={closePanel} disabled={saving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving && <span className="spinner" />}
                            {editingId == null
                                ? (saving ? "Adding..." : "Add User")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Name</label>
                    <input
                        name="name"
                        placeholder="Name"
                        value={form.name}
                        onChange={handleChange}
                        autoFocus
                    />
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>Email</label>
                    <input
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                    />
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                    <label>
                        {editingId == null ? "Password" : "New Password (optional)"}
                    </label>
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                    />
                </div>

                <div className="field">
                    <label>Role</label>
                    <select
                        name="roleID"
                        value={form.roleID}
                        onChange={handleChange}
                    >
                        <option value="">Select Role</option>
                        {
                            roles.map(role => (
                                <option key={role.roleID} value={role.roleID}>
                                    {role.roleName}
                                </option>
                            ))
                        }
                    </select>
                </div>
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            <Toast toast={toast} onDone={() => setToast(null)} />

        </div>

    );

}

export default User;