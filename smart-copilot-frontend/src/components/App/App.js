import React, { useState } from "react";
import Chat from "../Chat/Chat";
import Sidebar from "../Sidebar/Sidebar";
import "./App.css";

function App() {
    const [chats, setChats] = useState([
        { id: Date.now(), title: "New Chat", messages: [] }
    ]);
    const [activeChatId, setActiveChatId] = useState(chats[0].id);

    const handleNewChat = () => {
        const newChat = {
            id: Date.now(),
            title: "New Chat",
            messages: [],
        };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
    };

    const handleSelectChat = (id) => {
        setActiveChatId(id);
    };

    const updateChatMessages = (id, newMessages) => {
      setChats((prev) =>
        prev.map((chat) => {
          // Si c'est le premier message utilisateur, le titre est mis à jour
          if (chat.id === id && chat.title === "New Chat" && newMessages.length > 0) {
            const firstUserMessage = newMessages.find(msg => msg.sender === "User");
            const newTitle = firstUserMessage?.text?.slice(0, 40) + (firstUserMessage?.text?.length > 40 ? "..." : "");
            return { ...chat, messages: newMessages, title: newTitle || "Untitled Chat" };
          }
          return chat.id === id
            ? { ...chat, messages: newMessages }
            : chat;
        })
      );
    };
  

    const activeChat = chats.find((c) => c.id === activeChatId);

    return (
        <div className="app">
            <Sidebar
                chats={chats}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                activeChatId={activeChatId}
            />
            <Chat
                key={activeChat.id}
                chat={activeChat}
                onUpdateMessages={(msgs) =>
                    updateChatMessages(activeChat.id, msgs)
                }
            />
        </div>
    );
}

export default App;
