import React, { useState } from "react";
import axios from "axios";

function Chat() {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "User", text: input };
        setHistory((prev) => [...prev, userMessage]);
        setInput("");

        try {
            const res = await axios.post("http://localhost:5050/api/chat", {
                message: input,
            });

            const botResponse = { sender: "Copilot", text: res.data.response };
            setHistory((prev) => [...prev, botResponse]);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {history.map((msg, index) => (
                    <div
                        key={index}
                        className={msg.sender === "User" ? "user" : "bot"}
                    >
                        <strong>{msg.sender}:</strong> {msg.text}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your copilot..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default Chat;
