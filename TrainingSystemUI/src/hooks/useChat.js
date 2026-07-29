import { useState, useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { API_BASE } from "../api/axios";

export default function useChat(courseId) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const connectionRef = useRef(null);
    const courseIdRef = useRef(courseId);

    useEffect(() => {
        courseIdRef.current = courseId;
    }, [courseId]);

    useEffect(() => {
        if (!courseId) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        const hubUrl = API_BASE.replace("/api", "") + "/hubs/chat";

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => localStorage.getItem("token")
            })
            .withAutomaticReconnect()
            .build();

        let disposed = false;

        connection.on("ChatHistory", (history) => {
            if (!disposed) setMessages(history);
        });

        connection.on("NewMessage", (msg) => {
            if (disposed) return;
            setMessages(prev => {
                if (prev.some(m => m.courseChatMessageID === msg.courseChatMessageID)) {
                    return prev;
                }
                return [...prev, msg];
            });
        });

        connection.on("Error", (err) => {
            console.error("Chat error:", err);
        });

        connection.onreconnected(() => {
            const id = courseIdRef.current;
            if (id) {
                connection.invoke("JoinCourse", parseInt(id));
            }
        });

        connectionRef.current = connection;

        connection.start()
            .then(() => {
                if (!disposed) {
                    setConnected(true);
                    connection.invoke("JoinCourse", parseInt(courseId));
                }
            })
            .catch(err => console.error("SignalR connection error:", err));

        return () => {
            disposed = true;
            connection.invoke("LeaveCourse", parseInt(courseId))
                .finally(() => {
                    connection.stop();
                    if (connectionRef.current === connection) {
                        connectionRef.current = null;
                        setConnected(false);
                        setMessages([]);
                    }
                });
        };
    }, [courseId]);

    const sendMessage = useCallback((text) => {
        const conn = connectionRef.current;
        if (conn && connected && text.trim()) {
            const id = courseIdRef.current;
            const trimmed = text.trim();
            const tempId = -Date.now();

            setMessages(prev => [...prev, {
                courseChatMessageID: tempId,
                courseID: parseInt(id),
                senderName: "You",
                message: trimmed,
                sentAt: new Date().toISOString()
            }]);

            conn.invoke("SendMessage", parseInt(id), trimmed)
                .then(saved => {
                    if (saved && saved.courseChatMessageID) {
                        setMessages(prev =>
                            prev.map(m =>
                                m.courseChatMessageID === tempId ? saved : m
                            )
                        );
                    }
                })
                .catch(err => console.error("Send error:", err));
        }
    }, [connected]);

    return { messages, sendMessage, connected };
}
