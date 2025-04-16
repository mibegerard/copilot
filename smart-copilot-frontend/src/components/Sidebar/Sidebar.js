import React from "react";
import "./Sidebar.css";

function Sidebar({ chats, onNewChat, onSelectChat, activeChatId }) {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Smart Copilot</h2>
                <button className="new-chat" onClick={onNewChat}>+ New Chat</button>
            </div>
            <div className="sidebar-chats">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`chat-title ${chat.id === activeChatId ? "active" : ""}`}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        {chat.title}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Sidebar;
