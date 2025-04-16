import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./Chat.css";

function Chat() {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: "User", text: input, isCode: false };
        setHistory((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await axios.post("http://localhost:5050/api/chat", {
                message: input,
            });

            const botResponse = {
                sender: "Copilot",
                text: res.data.response,
                isCode: res.data.metadata?.containsCode || false,
                language: res.data.metadata?.language || null,
            };
            setHistory((prev) => [...prev, botResponse]);
        } catch (err) {
            console.error(err);
            setHistory((prev) => [
                ...prev,
                {
                    sender: "Copilot",
                    text: "Sorry, I encountered an error processing your request.",
                    isCode: false,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {history.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.sender === "User" ? "user" : "bot"}`}
                    >
                        <strong>{msg.sender}:</strong>
                        {msg.isCode ? (
                            <ReactMarkdown
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return !inline ? (
                                            <SyntaxHighlighter
                                                language={match?.[1] || "text"}
                                                style={nightOwl}
                                                PreTag="div"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {msg.text}
                            </ReactMarkdown>
                        ) : (
                            <p>{msg.text}</p>
                        )}
                    </div>
                ))}
                <div ref={chatEndRef} />
                {isLoading && (
                    <div className="message bot">
                        <strong>Copilot:</strong>
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
            </div>
            <div className="chat-input-container">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask your copilot..."
                    rows="1"
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                >
                    {isLoading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}

export default Chat;
