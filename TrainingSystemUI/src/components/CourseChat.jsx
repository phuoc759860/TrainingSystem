import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

export default function CourseChat({ courseId, courseTitle }) {
    const { user } = useAuth();
    const { messages, sendMessage, connected } = useChat(courseId);
    const [input, setInput] = useState("");
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        console.log("[CourseChat] sending message:", input);
        sendMessage(input);
        setInput("");
    };

    // Check if the user is enrolled in the course
    const isEnrolled = user.enrollments.some(enrollment => enrollment.courseId === courseId);

    // Check if the user is assigned to the course as a teacher
    const isTeacher = user.roles.includes('Teacher') && user.teachingCourses.includes(courseId);

    return (
        <div>
            {isEnrolled || isTeacher ? (
                <div className="chat-container">
                    {/* Chat UI components */}
                    <ul ref={listRef}>
                        {messages.map((message, index) => (
                            <li key={index} className={`message ${message.sender === user.id ? 'sent' : 'received'}`}>
                                {message.text}
                            </li>
                        ))}
                    </ul>
                    <div className="chat-input">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                        />
                        <button onClick={handleSend}>Send</button>
                    </div>
                </div>
            ) : (
                <div className="chat-container">
                    <p>Sorry, you are not authorized to chat in this course.</p>
                </div>
            )}
        </div>
    );
}
