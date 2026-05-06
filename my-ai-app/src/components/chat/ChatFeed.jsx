// src/components/chat/ChatFeed.jsx
import { useEffect, useRef } from "react";
import { marked } from "marked";

export function Markdown({ content }) {
  // Parse markdown into html
  const html = "" + marked.parse(content);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
      <div className="message-avatar">{isUser ? "👤" : "🤖"}</div>
      <div className="message-bubble">
        <Markdown content={message.content} />

        {message.role === "assistant" && message.streaming && (
          <span className="streaming-cursor">▌</span>
        )}
      </div>
    </div>
  );
}

function ChatFeed({ messages, isGenerating }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="chat-feed chat-empty">
        <p>Start a conversation below ↓</p>
      </div>
    );
  }

  return (
    <div className="chat-feed">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {/* Invisible anchor element at the bottom for auto-scrolling */}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatFeed;
