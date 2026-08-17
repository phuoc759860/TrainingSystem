import React, { useEffect, useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import { getMyEnrollments } from '../services/EnrollmentService';
import { getCourse } from '../services/CourseService';

export default function CourseChat({ courseId, courseTitle }) {
    const auth = useAuth();
    const { messages, sendMessage, connected } = useChat(courseId);
    const [input, setInput] = useState("");
    const listRef = useRef(null);
    const [authorized, setAuthorized] = useState(null);

    useEffect(() => {
        if (!courseId || !auth.isAuthenticated) {
            setAuthorized(false);
            return;
        }
        checkAccess();
    }, [courseId, auth.isAuthenticated]);

    const checkAccess = async () => {
        try {
            if (auth.isAdmin) {
                setAuthorized(true);
                return;
            }
            if (auth.isStudent) {
                const res = await getMyEnrollments();
                const enrollments = res.data;
                const enrolled = enrollments.some(
                    e => e.courseID === parseInt(courseId) && e.status === "Enrolled"
                );
                setAuthorized(enrolled);
                return;
            }
            if (auth.isTrainer) {
                const res = await getCourse(courseId);
                setAuthorized(res.data.trainerID === parseInt(auth.userID));
                return;
            }
            setAuthorized(false);
        } catch {
            setAuthorized(false);
        }
    };

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput("");
    };

    if (authorized === null) {
        return (
            <div className="course-chat">
                <div className="loading-row" style={{ padding: 20 }}><span className="spinner" /> Checking access...</div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="course-chat">
                <div className="course-chat-empty">Sorry, you are not authorized to chat in this course.</div>
            </div>
        );
    }

    return (
        <div className="course-chat">
            <div className="course-chat-header">
                <span>{courseTitle || `Course #${courseId}`}</span>
                <span className={`course-chat-status ${connected ? "online" : "offline"}`}>
                    {connected ? "Connected" : "Connecting..."}
                </span>
            </div>
            <div className="course-chat-messages" ref={listRef}>
                {messages.length === 0 && (
                    <div className="course-chat-empty">No messages yet. Start a conversation!</div>
                )}
                {messages.map((msg) => (
                    <div key={msg.courseChatMessageID} className="course-chat-msg">
                        <span className="course-chat-msg-author">{msg.senderName || `User ${msg.senderID}`}</span>
                        <span className="course-chat-msg-time">{msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString() : ""}</span>
                        <div className="course-chat-msg-text">{msg.message}</div>
                    </div>
                ))}
            </div>
            <div className="course-chat-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    maxLength={2000}
                    disabled={!connected}
                />
                <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={!connected || !input.trim()}>Send</button>
                <span className={`char-counter${input.length > 1900 ? " warn" : ""}`}>{input.length}/2000</span>
            </div>
        </div>
    );
}
