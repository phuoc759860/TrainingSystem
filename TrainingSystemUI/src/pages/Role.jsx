import { useEffect, useState, useMemo } from "react";
import {
    getRoles,
    createRole,
    updateRole,
    deleteRole
} from "../services/RoleService";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import SidePanel from "../components/SidePanel";

function Role() {

    const [roles, setRoles] = useState([]);
    const [roleName, setRoleName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [confirmState, setConfirmState] = useState(null);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const res = await getRoles();
            setRoles(res.data);
        }
        catch {
            setToast({ message: "Couldn't load roles. Try refreshing.", type: "error" });
        }
        finally {
            setLoading(false);
        }
    };

    const closePanel = () => {
        setPanelOpen(false);
        setEditingId(null);
        setRoleName("");
    };

    const openCreatePanel = () => {
        setEditingId(null);
        setRoleName("");
        setPanelOpen(true);
    };

    const openEditPanel = (role) => {
        setEditingId(role.roleID);
        setRoleName(role.roleName);
        setPanelOpen(true);
    };

    const handleSubmit = async () => {

        if (roleName.trim() === "") {
            setToast({ message: "Role name is required.", type: "error" });
            return;
        }

        setSaving(true);

        try {

            if (editingId == null) {
                await createRole({ roleName });
                setToast({ message: "Role created.", type: "success" });
            } else {
                await updateRole(editingId, { roleName });
                setToast({ message: "Role updated.", type: "success" });
            }

            closePanel();
            loadRoles();

        } catch {
            setToast({ message: "Operation failed.", type: "error" });
        } finally {
            setSaving(false);
        }

    };

    const handleDelete = (role) => {
        setConfirmState({
            title: `Delete "${role.roleName}"?`,
            message: "Users assigned to this role may be affected. This can't be undone.",
            confirmLabel: "Delete role",
            danger: true,
            onConfirm: async () => {
                try {
                    await deleteRole(role.roleID);
                    setToast({ message: "Role deleted.", type: "success" });
                    loadRoles();
                }
                catch {
                    setToast({ message: "Couldn't delete that role.", type: "error" });
                }
            }
        });
    };

    const filteredRoles = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter(r => r.roleName?.toLowerCase().includes(q));
    }, [roles, search]);

    return (

        <div className="page">

            <div className="welcome-banner">
                <h2>Role Management</h2>
                <p>Define user roles and access permissions</p>
            </div>

            <div className="page-header">
                <div>
                    <h2 style={{ marginTop: 0 }}>Roles</h2>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search roles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={openCreatePanel}>
                        + New Role
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-row">
                    <span className="spinner" /> Loading roles...
                </div>
            ) : filteredRoles.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">🏷️</div>
                    <p>
                        {search
                            ? "No roles match your search."
                            : "No roles yet. Create one to get started."}
                    </p>
                </div>
            ) : (
                <table className="table-modern fade-in">

                    <thead>
                        <tr>
                            <th>Name</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {
                            filteredRoles.map(role => (
                                <tr key={role.roleID}>
                                    <td style={{ fontWeight: 500 }}>{role.roleName}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => openEditPanel(role)}
                                        >
                                            Edit
                                        </button>{" "}
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(role)}
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

            <SidePanel
                open={panelOpen}
                title={editingId == null ? "Add Role" : "Edit Role"}
                subtitle={editingId != null ? `Editing "${roleName}"` : undefined}
                onClose={closePanel}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={closePanel} disabled={saving}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving && <span className="spinner" />}
                            {editingId == null
                                ? (saving ? "Adding..." : "Add Role")
                                : (saving ? "Saving..." : "Save Changes")}
                        </button>
                    </>
                }
            >
                <div className="field">
                    <label>Role Name</label>
                    <input
                        placeholder="e.g. Trainer"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        autoFocus
                    />
                </div>
            </SidePanel>

            <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
            <Toast toast={toast} onDone={() => setToast(null)} />

        </div>

    );

}

export default Role;