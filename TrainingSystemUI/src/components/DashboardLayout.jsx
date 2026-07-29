import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import NotificationsDropdown from "./NotificationsDropdown";
import { SIDEBAR, getSidebarIcon } from "../config/navigation";
import useAuth from "../hooks/useAuth";

function DashboardLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { role, name, email, logout: doLogout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const logout = () => {
        doLogout();
        navigate("/");
    };

    const groups = SIDEBAR[role] || SIDEBAR.Student;

    const initials = name
        ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    const allItems = groups.flatMap(g => g.items || []);
    const currentPage = allItems.find(item => location.pathname === item.path);

    return (
        <div className={`layout ${collapsed ? "layout-collapsed" : ""}`}>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="var(--brand)" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="var(--brand-light)" />
                        </svg>
                        {!collapsed && <span className="sidebar-brand-text">TrainingHub</span>}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {groups.map((group, gi) => {
                        const items = group.items || [group];
                        return (
                            <div key={gi} style={{ marginBottom: collapsed ? "4px" : "6px" }}>
                                {!collapsed && (
                                    <div className="sidebar-group-label">
                                        {group.label}
                                    </div>
                                )}
                                {items.map(item => {
                                    const Icon = getSidebarIcon(item.key);
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                                            }
                                            end={item.path === "/dashboard"}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <span className="sidebar-link-icon">
                                                <Icon size={18} />
                                            </span>
                                            {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{initials}</div>
                        {!collapsed && (
                            <div className="sidebar-user-info">
                                <div className="sidebar-user-name">{name}</div>
                                <div className="sidebar-user-role">{role}</div>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn btn-sm sidebar-logout"
                        onClick={logout}
                        title="Logout"
                    >
                        {collapsed ? <LogOut size={16} /> : "Logout"}
                    </button>
                </div>
            </aside>

            <div className="layout-main-wrapper">
                <header className="topnav">
                    <div className="topnav-left">
                        <div className="topnav-breadcrumb">
                            <a href="/dashboard">Home</a>
                            <span className="separator">/</span>
                            <span className="current">{currentPage?.label || "Dashboard"}</span>
                        </div>
                    </div>
                    <div className="topnav-right">
                        <NotificationsDropdown />
                        <div className="user-menu-wrapper" ref={userMenuRef}>
                            <button
                                className="topnav-avatar"
                                title={name}
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                {initials}
                            </button>

                            {userMenuOpen && (
                                <div className="user-dropdown">
                                    <div className="user-dropdown-header">
                                        <div className="user-dropdown-avatar">{initials}</div>
                                        <div className="user-dropdown-info">
                                            <div className="user-dropdown-name">{name}</div>
                                            <div className="user-dropdown-email">{email || "No email"}</div>
                                        </div>
                                    </div>
                                    <div className="user-dropdown-divider" />
                                    <div className="user-dropdown-details">
                                        <div className="user-dropdown-detail-row">
                                            <span className="user-dropdown-label">Role</span>
                                            <span className="user-dropdown-value">{role}</span>
                                        </div>
                                    </div>
                                    <div className="user-dropdown-divider" />
                                    <button
                                        className="user-dropdown-logout"
                                        onClick={logout}
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="layout-main">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
