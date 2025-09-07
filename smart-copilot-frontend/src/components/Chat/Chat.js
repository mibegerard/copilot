import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "highlight.js/styles/github-dark-dimmed.css";
import "./Chat.css";
import rehypeHighlight from "rehype-highlight";

function Chat({ chat, onUpdateMessages }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: "User", text: input };
    const updatedHistory = [...chat.messages, userMessage];

    onUpdateMessages(updatedHistory);
    setInput("");
    setIsLoading(true);

      // Log the API URL
  console.log("API URL being used:", process.env.REACT_APP_API_URL);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/chat`, {
        message: input,
      });

      const botResponse = {
        sender: "Copilot",
        text: res.data.response,
        isCode: res.data.metadata?.containsCode || false,
        language: res.data.metadata?.language || null,
      };

      onUpdateMessages([...updatedHistory, botResponse]);
    } catch (err) {
      console.error(err);
      onUpdateMessages([
        ...updatedHistory,
        {
          sender: "Copilot",
          text: "Sorry, I encountered an error.",
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

  const formatMessage = (text) => {
  const isProbablyCode = text.includes('def ') || text.includes('@requires') || text.includes('vault.') || text.includes('postings');

  // Step 1: Replace literal "\n" with actual line breaks
  let cleanText = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

  // Step 2: Wrap it in a code block if it seems to be code
  if (isProbablyCode && !cleanText.includes('```')) {
    cleanText = `\`\`\`python\n${cleanText.trim()}\n\`\`\``;
  }

  return cleanText;
};

return (
    <div className="chat-container">
        <div className="chat-history">
            {chat.messages.map((msg, index) => (
                <div
                    key={index}
                    className={`message ${msg.sender === "User" ? "user" : "bot"}`}
                >
                    {msg.sender === "Copilot" ? (
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                        {formatMessage(msg.text)}
                    </ReactMarkdown>
                    ) : (
                    <span>{msg.text}</span>
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
            <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                {isLoading ? "..." : "Send"}
            </button>
        </div>
    </div>
);
}

export default Chat;