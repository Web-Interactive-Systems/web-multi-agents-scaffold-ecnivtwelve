---
id: xl1eqxc9chhvzqy8
type: NoteCard
createdAt: 2026-03-25T08:39:47.874Z
viewedAt: 2026-03-25T08:45:07.597Z
---

# Chapter 4 — Global State with Valtio
> Goal: Create a single global state store that every component can read and write, without prop drilling.

***

## 3.1 The Problem: Prop Drilling

Imagine a user clicks a thread in the sidebar. The sidebar needs to tell the workspace which thread to display.

```auto
App
 ├── Sidebar   (has the click event)
 └── Workspace (needs to know which thread is active)
```

The naïve approach:

To pass data from Sidebar to Workspace, you would need to lift state up to App, pass a setter down to Sidebar, and pass the value down to Workspace. As the app grows, this becomes harder to manage — prop drilling.

The solution is global state: a single source of truth that any component can subscribe (read/write) to directly.

***

## 3.2 Why Valtio?

There are many global state solutions: Redux, Zustand, Jotai, MobX, React Context. We use Valtio because:

-   It's a proxy. You mutate state directly (store.threads.push(...)) — no reducers, no actions, no boilerplate.
-   Subscriptions are automatic. Components that read from the store re-render only when the part they read changes.
-   The mental model is simple: it's a JavaScript object. If you can write obj.count++, you can use Valtio.

> 📖 Valtio docs: https://valtio.dev/docs/introduction/getting-started

***

## 3.3 How Valtio Works

Valtio wraps your state object in a JavaScript Proxy. A Proxy intercepts get/set operations on an object. When a component reads snapshot.threads, Valtio notes "this component depends on threads". When any code writes store.threads.push(...), Valtio re-renders all components that read threads.

```js
import { proxy, useSnapshot } from 'valtio';

const store = proxy({ count: 0 });   // create the proxy

// To READ (inside a ** React component **):
const snap = useSnapshot(store);      // snap.count is reactive
console.log(snap.count);

// To WRITE (anywhere — component, event handler, async function):
store.count++;                         // directly mutate the proxy
```

Key distinction:

-   Read via useSnapshot (returns a frozen, reactive snapshot)
-   Write via the store object directly (mutations trigger re-renders)

***

## 3.4 Define the Store

Create the store file via vscode or terminal:

```bash
mkdir -p src/store
touch src/store/index.js
```

```js
// src/store/index.js
import { proxy } from 'valtio';

// ── Thread shape ─────────────────────────────────────────────
// A thread is a conversation. It contains an array of messages.
// Each message has: id, role ('user' | 'assistant'), content, timestamp.

function createMessage(role, content) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: Date.now(),
  };
}

function createThread(title = 'New chat') {
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: Date.now(),
  };
}

// ── The global store ─────────────────────────────────────────
export const store = proxy({
  // Which thread is currently open (null = no chat open)
  activeThreadId: null,

  // All chat threads
  threads: [],

  // Is the LLM currently generating a response?
  isGenerating: false,

  // UI state: which sidebar panel is visible on mobile
  sidebarOpen: true,
});

// ── Actions ──────────────────────────────────────────────────
// Actions are plain functions that mutate the store.
// We export them alongside the store so components import
// what they need without knowing how the store is structured.

export function newThread() {
  const thread = createThread();
  store.threads.unshift(thread);        // add to top of list
  store.activeThreadId = thread.id;
  return thread.id;
}

export function setActiveThread(threadId) {
  store.activeThreadId = threadId;
}

export function addMessage(threadId, role, content) {
  const thread = store.threads.find(t => t.id === threadId);
  if (!thread) return;

  const message = createMessage(role, content);
  thread.messages.push(message);

  // Auto-title the thread from the first user message
  if (role === 'user' && thread.messages.length === 1) {
    thread.title = content.slice(0, 60);
  }

  return message.id;
}

export function updateLastAssistantMessage(threadId, contentChunk) {
  // Used during streaming to append tokens to the last message
  const thread = store.threads.find(t => t.id === threadId);
  if (!thread) return;

  const lastMsg = thread.messages[thread.messages.length - 1];
  if (lastMsg?.role === 'assistant') {
    lastMsg.content += contentChunk;
  }
}

export function getActiveThread() {
  return store.threads.find(t => t.id === store.activeThreadId) ?? null;
}

// Export helpers so other modules can create typed objects consistently
export { createMessage, createThread };
```

***

## 3.5 Using the Store in Components

Update the Sidebar to read threads from the store:

```jsx
// src/components/Sidebar.jsx
import { useSnapshot } from 'valtio';
import { store, newThread, setActiveThread } from '../store';

const features = [
  { id: 'home',     label: '🏠 Home',     path: '/' },
  { id: 'chat',     label: '💬 Chat',     path: '/chat' },
  { id: 'research', label: '🔬 Research', path: '/research' },
  { id: 'write',    label: '✍️  Write',   path: '/write' },
];

function Sidebar() {
  const snap = useSnapshot(store);    // reactive snapshot

  return (
    <aside className="sidebar">

      {/* ── TOP ZONE ── */}
      <div className="sidebar-features">
        <p className="sidebar-section-label">Features</p>
        <nav>
          {features.map(f => (
            <button key={f.id} className="sidebar-item">
              {f.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── BOTTOM ZONE ── */}
      <div className="sidebar-threads">
        <div className="sidebar-threads-header">
          <p className="sidebar-section-label">Recent chats</p>
          <button
            className="new-thread-btn"
            onClick={newThread}
            title="New chat"
          >
            +
          </button>
        </div>

        <ul>
          {snap.threads.map(thread => (
            <li
              key={thread.id}
              className={`sidebar-item thread-item ${
                thread.id === snap.activeThreadId ? 'active' : ''
              }`}
              onClick={() => setActiveThread(thread.id)}
            >
              {thread.title}
            </li>
          ))}

          {snap.threads.length === 0 && (
            <li className="sidebar-empty">No chats yet</li>
          )}
        </ul>
      </div>

    </aside>
  );
}

export default Sidebar;
```

Add the missing styles to index.css:

```css
.sidebar-threads-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.new-thread-btn {
  background: none;
  border: 1px solid #2a2f42;
  color: #7b82a0;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-thread-btn:hover {
  background: #2a2f42;
  color: #e4e7f0;
}

.sidebar-item.active {
  background: #2a2f42;
  color: #e4e7f0;
}

.sidebar-empty {
  list-style: none;
  font-size: 13px;
  color: #7b82a0;
  padding: 8px 10px;
  font-style: italic;
}
```

***

## 3.6 Why Not React Context?

React's built-in Context API can do global state, but it has a key limitation: any component that reads a context re-renders when any part of that context changes, even if it only uses one field. Valtio's proxy-based subscriptions are more granular — a component re-renders only when the specific property it reads changes.

For this app size, the difference is minor. But Valtio's direct-mutation API is also much less boilerplate than useReducer + Context, which matters for learning speed.

> 📖 Valtio vs other solutions: https://valtio.dev/docs/introduction/why-valtio

***

## ✅ Checkpoint

1.  Click the + button in the sidebar threads section — a new thread titled "New chat" should appear
2.  Click the thread — it should highlight (the active state)
3.  Click + again — the new thread appears at the top of the list, and auto-focuses
4.  No errors in the browser console

Open your browser's React DevTools if you have them — look at the Valtio proxy store. You should see threads growing as you create new ones.

***

➡️ Next: Chapter 5 — Client-Side Routing with React Router