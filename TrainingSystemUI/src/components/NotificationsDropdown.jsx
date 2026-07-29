import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from "../services/NotificationService";

function NotificationsDropdown() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadUnreadCount = async () => {
        try {
            const res = await getUnreadNotificationCount();
            setUnreadCount(res.data.total ?? 0);
        } catch (err) { console.error(err); }
    };

    const toggle = async () => {
        if (!open) {
            try {
                const res = await getNotifications();
                setNotifications(res.data);
            } catch (err) { console.error(err); }
        }
        setOpen(!open);
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.notificationID === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="notifications-dropdown" ref={ref}>
            <button className="topnav-icon-btn" onClick={toggle} title="Notifications">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && <span className="notifications-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>

            {open && (
                <div className="notifications-panel">
                    <div className="notifications-header">
                        <span style={{ fontWeight: 600 }}>Notifications</span>
                        {unreadCount > 0 && (
                            <button className="btn btn-sm btn-ghost" onClick={handleMarkAllRead} style={{ fontSize: 12 }}>
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <div className="notifications-empty">No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.notificationID}
                                    className={`notification-item ${!n.isRead ? "notification-unread" : ""}`}
                                    onClick={() => {
                                        handleMarkRead(n.notificationID);
                                        if (n.link) navigate(n.link);
                                    }}
                                >
                                    <div className="notification-content">
                                        <div className="notification-message">{n.title}</div>
                                        <div className="notification-time">{new Date(n.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    {!n.isRead && <div className="notification-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationsDropdown;
