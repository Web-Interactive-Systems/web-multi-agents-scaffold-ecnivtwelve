---
id: af4yxsl6wwmg68k1
type: NoteCard
createdAt: 2026-03-25T08:55:12.709Z
viewedAt: 2026-03-25T08:58:23.141Z
---

# Chapter 7 — The Chat Interface
> Goal: Build the full chat experience — a message feed that streams responses in real time, a composer bar fixed at the bottom, and automatic thread creation when a new conversation starts.

***

## 6.1 Chat UI Architecture

The chat interface has three responsibilities:

1.  Display the message history of the active thread
2.  Compose new messages and send them to the LLM
3.  Stream the response back into the feed, token by token

The layout within the workspace when on /chat:

```auto
┌─────────────────────────────────────────┐
│ ChatPage                                │
│ ┌─────────────────────────────────────┐ │
│ │ ChatFeed (flex: 1, overflow-y:auto) │ │
│ │                                     │ │
│ │  [user]    Hello!                   │ │
│ │  [assistant] Hi there! How...       │ │
│ │  [assistant] ▌ (streaming cursor)   │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Composer (fixed at bottom)          │ │
│ │ [textarea ................] [Send]  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

The ChatPage is a flex column. ChatFeed grows to fill space and scrolls internally. Composer stays pinned at the bottom.

***

## 6.2 Create the Component Files

Use vscode or terminal to create files:

```bash
mkdir -p src/components/chat
touch src/components/chat/ChatFeed.jsx
touch src/components/chat/Composer.jsx
```

***

## 6.3 The ChatFeed Component

```jsx
// src/components/chat/ChatFeed.jsx
import { useEffect, useRef } from 'react';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-bubble">
        {/* Render newlines as <br> for basic formatting */}
        {message.content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split('\n').length - 1 && <br />}
          </span>
        ))}
        {/* Blinking cursor shown during streaming (empty content = still arriving) */}
        {message.role === 'assistant' && message.streaming && (
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {/* Invisible anchor element at the bottom for auto-scrolling */}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatFeed;
```

Why useRef for scrolling?

useRef gives you a stable reference to a DOM element without triggering re-renders. scrollIntoView is a DOM method — we need the actual element, not React state. Any time messages changes (new message or streamed chunk), the effect fires and scrolls the bottom anchor into view.

> 📖 useRef: https://react.dev/reference/react/useRef

***

## 6.4 The Composer Component

```jsx
// src/components/chat/Composer.jsx
import { useState, useRef } from 'react';

function Composer({ onSend, isGenerating }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    onSend(trimmed);
    setText('');

    // Return focus to textarea after sending
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  // Send on Enter, newline on Shift+Enter
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="composer">
      <textarea
        ref={textareaRef}
        className="composer-input"
        placeholder="Message… (Enter to send, Shift+Enter for newline)"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={isGenerating}
      />
      <button
        className="composer-send"
        onClick={handleSend}
        disabled={!text.trim() || isGenerating}
      >
        {isGenerating ? '⏳' : '↑'}
      </button>
    </div>
  );
}

export default Composer;
```

***

## 6.5 The ChatPage — Wiring it All Together

This is the most important component. It coordinates the store, the LLM client, and the child components:

```jsx
// src/pages/ChatPage.jsx
import { useSnapshot } from 'valtio';
import { useNavigate } from 'react-router';
import { store, newThread, addMessage, updateLastAssistantMessage, getActiveThread } from '../store';
import { streamCompletion } from '../lib/llmClient';
import ChatFeed from '../components/chat/ChatFeed';
import Composer from '../components/chat/Composer';

function ChatPage() {
  const snap = useSnapshot(store);
  const navigate = useNavigate();

  // Get the currently active thread (null if none)
  const activeThread = snap.threads.find(t => t.id === snap.activeThreadId) ?? null;

  async function handleSend(userText) {
    // ── 1. Ensure we have an active thread ──
    let threadId = store.activeThreadId;
    if (!threadId) {
      threadId = newThread();
      navigate('/chat');
    }

    // ── 2. Add the user message to the store ──
    addMessage(threadId, 'user', userText);

    // ── 3. Add an empty assistant message (will fill via streaming) ──
    addMessage(threadId, 'assistant', '');

    // ── 4. Build the messages array for the API ──
    // Use the store directly (not snap) to get the latest state
    const thread = getActiveThread();
    const apiMessages = thread.messages
      .filter(m => m.content !== '' || m.role === 'user')  // skip the empty assistant placeholder
      .slice(0, -1)  // exclude the empty assistant message we just added
      .map(m => ({ role: m.role, content: m.content }));

    // ── 5. Mark as generating ──
    store.isGenerating = true;

    try {
      // ── 6. Stream the response ──
      await streamCompletion(
        apiMessages,
        (delta) => {
          // Called for each token — append to the last assistant message
          updateLastAssistantMessage(threadId, delta);
        }
      );
    } catch (error) {
      console.error('LLM error:', error);
      updateLastAssistantMessage(threadId, '\n\n[Error: ' + error.message + ']');
    } finally {
      // ── 7. Done generating ──
      store.isGenerating = false;
    }
  }

  return (
    <div className="chat-page">
      <ChatFeed
        messages={activeThread?.messages ?? []}
        isGenerating={snap.isGenerating}
      />
      <Composer
        onSend={handleSend}
        isGenerating={snap.isGenerating}
      />
    </div>
  );
}

export default ChatPage;
```

Key design decisions:

-   Optimistic UI: We add the user message to the store immediately (step 2), before the API responds. The UI feels instant.
-   Streaming via store: Instead of React local state, we write streaming chunks directly to the Valtio store. Any component that reads the thread's messages will re-render with each new chunk — including ChatFeed.
-   Error handling: Network errors are caught and shown as a message in the feed rather than crashing the UI.

***

## 6.6 Wire Up Sidebar Thread Navigation to Chat

Update the handleNewThread function in Sidebar.jsx to navigate to /chat:

```jsx
// In Sidebar.jsx — update the handleNewThread function:
import { useNavigate } from 'react-router';

function Sidebar() {
  const navigate = useNavigate();
  // ...

  function handleNewThread() {
    newThread();
    navigate('/chat');
  }

  // Also, clicking an existing thread should navigate to chat:
  function handleThreadClick(threadId) {
    setActiveThread(threadId);
    navigate('/chat');
  }

  // ... in the JSX, update the thread list items:
  // onClick={() => handleThreadClick(thread.id)}
}
```

***

## 6.7 Add the CSS

```css
/* ── ChatPage layout ── */
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;          /* fills the workspace */
  overflow: hidden;
}

/* ── Chat feed ── */
.chat-feed {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-empty {
  align-items: center;
  justify-content: center;
  color: #7b82a0;
  font-style: italic;
}

/* ── Message bubbles ── */
.message-row {
  display: flex;
  gap: 12px;
  max-width: 720px;
}

.message-row.user {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2a2f42;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.message-bubble {
  background: #181b24;
  border: 1px solid #2a2f42;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.6;
  color: #e4e7f0;
  max-width: 600px;
  white-space: pre-wrap;   /* preserve whitespace and newlines */
  word-break: break-word;
}

.message-row.user .message-bubble {
  background: #2d2a5e;
  border-color: #6c63ff;
  color: #e4e7f0;
}

.streaming-cursor {
  display: inline-block;
  animation: blink 0.8s step-end infinite;
  color: #6c63ff;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* ── Composer ── */
.composer {
  display: flex;
  gap: 8px;
  padding: 16px 32px 24px;
  border-top: 1px solid #2a2f42;
  background: #0f1117;
}

.composer-input {
  flex: 1;
  background: #181b24;
  border: 1px solid #2a2f42;
  border-radius: 10px;
  color: #e4e7f0;
  font-size: 15px;
  font-family: inherit;
  padding: 12px 16px;
  resize: none;
  outline: none;
  transition: border-color 0.15s;
  min-height: 48px;
  max-height: 200px;
  line-height: 1.5;
}

.composer-input:focus {
  border-color: #6c63ff;
}

.composer-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.composer-send {
  width: 48px;
  height: 48px;
  background: #6c63ff;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.composer-send:hover:not(:disabled) {
  background: #5a52e0;
}

.composer-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

***

## 6.8 Stretch Goal: Auto-resize Textarea

The textarea currently stays one row tall. This snippet auto-expands it as the user types:

```jsx
// In Composer.jsx — add this effect:
import { useEffect } from 'react';

// Inside the component:
useEffect(() => {
  const ta = textareaRef.current;
  if (!ta) return;
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
}, [text]);
```

This resets the height to auto on each keystroke, then sets it to the scroll height (capped at 200px). Simple and works without any library.

***

## ✅ Checkpoint

1.  Navigate to /chat via the sidebar
2.  Type a message and press Enter — it appears in the feed immediately
3.  A streaming response starts appearing character by character
4.  The blinking cursor ▌ shows while the response is generating
5.  After the response finishes, you can send another message
6.  Click the + button in the sidebar — a new thread is created, the feed clears
7.  Type a message — the thread in the sidebar gets auto-titled with your first message

***

➡️ Next: Chapter 8 — Multi-Agent Infrastructure