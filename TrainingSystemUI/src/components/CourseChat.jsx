import { useState, useEffect, useRef } from "react";
import useChat from "../hooks/useChat";

export default function CourseChat({ courseId, courseTitle }) {
    const { messages, sendMessage, connected } = useChat(courseId);
    const [input, setInput] = useState("");
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        console.log("[CourseChat] messages updated:", messages.length);
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        console.log("[CourseChat] sending message:", input);
        sendMessage(input);
        setInput("");
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="course-chat">
            <div className="course-chat-header">
                <span>{courseTitle || "Course Chat"}</span>
                <span className={`course-chat-status ${connected ? "online" : "offline"}`}>
                    {connected ? "Connected" : "Connecting..."}
                </span>
            </div>

            <div className="course-chat-messages" ref={listRef}>
                {messages.length === 0 ? (
                    <div className="course-chat-empty">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map(m => (
                        <div key={m.courseChatMessageID} className="course-chat-msg">
                            <span className="course-chat-msg-author">{m.senderName}</span>
                            <span className="course-chat-msg-time">
                                {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <div className="course-chat-msg-text">{m.message}</div>
                        </div>
                    ))
                )}
            </div>

            <div className="course-chat-input">
                <textarea
                    rows="2"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    disabled={!connected}
                />
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSend}
                    disabled={!connected || !input.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
