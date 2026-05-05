// src/components/chat/Composer.jsx
import { useEffect } from "react";
import { useState, useRef } from "react";

function Composer({ onSend, isGenerating }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    onSend(trimmed);
    setText("");

    // Return focus to textarea after sending
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  // Send on Enter, newline on Shift+Enter
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text]);

  return (
    <div className="composer">
      <textarea
        ref={textareaRef}
        className="composer-input"
        placeholder="Message… (Enter to send, Shift+Enter for newline)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={isGenerating}
      />
      <button
        className="composer-send"
        onClick={handleSend}
        disabled={!text.trim() || isGenerating}
      >
        {isGenerating ? "⏳" : "↑"}
      </button>
    </div>
  );
}

export default Composer;
