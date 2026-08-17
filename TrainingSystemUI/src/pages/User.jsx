import { useEffect, useState } from "react";
import useDebouncedValue from "../hooks/useDebouncedValue";
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} from "../services/UserService";
import { getRoles } from "../services/RoleService";
import ConfirmDialog from "../components/ConfirmDialog";
import SidePanel from "../components/SidePanel";
import Pagination from "../components/Pagination";
import useToast from "../hooks/useToast";

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
    const { showToast, toastEl } = useToast();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [form, setForm] = useState(blankForm());
    const debouncedSearch = useDebouncedValue(search);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter]);

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, [page, debouncedSearch, roleFilter]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await getUsers(page, 20, debouncedSearch, roleFilter);
            setUsers(res.data.items);
            setTotalPages(res.data.totalPages);
        }
        catch (err) { console.error(err);
            showToast("Couldn't load users. Try refreshing.", "error");
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
            showToast("Name, email, and role are required.", "error");
            return;
        }
        if (editingId == null && !form.password) {
            showToast("Password is required for new users.", "error");
            return;
        }

        setSaving(true);

        try {

            if (editingId == null) {
                await createUser(form);
                showToast("User created.", "success");
            }
            else {
                await updateUser(editingId, form);
                showToast("User updated.", "success");
            }

            closePanel();
            loadUsers();

        }
        catch (err) {
            console.error(err);
            showToast("Operation failed.", "error");
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
                    showToast("User deleted.", "success");
                    loadUsers();
                }
                catch (err) {
                    console.error(err);
                    const msg = err?.response?.data?.message || err?.response?.data?.title || "Couldn't delete that user.";
                    showToast(msg, "error");
                }
            }
        });
    };



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
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="search-input"
                        style={{ minWidth: 140 }}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        {
                            roles.map(role => (
                                <option key={role.roleID} value={role.roleID}>
                                    {role.roleName}
                                </option>
                            ))
                        }
                    </select>
                    <button className="btn btn-primary" onClick={openCreatePanel}>
                        + New User
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading users...
                </div>
            ) : users.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">👤</div>
                    <p>
                        {search || roleFilter
                            ? "No users match your filters."
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
                            users.map(user => (
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
            {toastEl}

        </div>

    );

}

export default User;