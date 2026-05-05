---
id: jdixngo2ryg92iqc
type: NoteCard
createdAt: 2026-03-25T08:45:25.918Z
viewedAt: 2026-03-25T08:48:44.865Z
---

# Chapter 5 — Client-Side Routing with React Router
> Goal: Connect the sidebar navigation to URL-based routes, so each feature renders a different component in the workspace — without a full page reload.

***

## 4.1 What is Client-Side Routing?

In a traditional website, clicking a link sends a new HTTP request to the server, which returns a new HTML page. The browser fully reloads.

In a Single Page Application (SPA), the browser never reloads. React Router intercepts link clicks, updates the URL in the address bar, and swaps out components — all in JavaScript, with no server round-trip.

```auto
User clicks "Chat"
       │
       ▼
React Router updates URL: /chat
       │
       ▼
Router renders <ChatPage /> inside <Workspace />
       │
       ▼
Sidebar and other persistent elements stay mounted (no reload)
```

This is why SPAs feel fast: the shell (sidebar, header) is always mounted, only the content area changes.

> 📖 React Router tutorial: https://reactrouter.com/en/main/start/tutorial

***

## 4.2 Core React Router Concepts

| Concept                            | What it does                                      |
| ---------------------------------- | ------------------------------------------------- |
| \<BrowserRouter>                   | Wraps the whole app; enables routing context      |
| \<Routes>                          | Container for route definitions                   |
| \<Route path="/" element={\<X />}> | Renders \<X /> when URL matches path              |
| \<Link to="/chat">                 | Renders an \<a> tag that navigates without reload |
| useNavigate()                      | Hook — call navigate('/chat') programmatically    |
| useLocation()                      | Hook — gives you the current URL location object  |

***

## 4.3 Create Page Components

Create placeholder pages for each route via vscode or terminal:

```bash
mkdir -p src/pages
touch src/pages/HomePage.jsx
touch src/pages/ChatPage.jsx
touch src/pages/ResearchPage.jsx
touch src/pages/WritePage.jsx
```

```jsx
// src/pages/HomePage.jsx
function HomePage() {
  return (
    <div className="page">
      <h2>Welcome</h2>
      <p>Choose a feature from the sidebar to get started.</p>
    </div>
  );
}
export default HomePage;
```

```jsx
// src/pages/ResearchPage.jsx
function ResearchPage() {
  return (
    <div className="page">
      <h2>🔬 Research</h2>
      <p>Multi-agent research assistant — coming in Chapter 7.</p>
    </div>
  );
}
export default ResearchPage;
```

```jsx
// src/pages/WritePage.jsx
function WritePage() {
  return (
    <div className="page">
      <h2>✍️ Write</h2>
      <p>AI writing assistant — a project extension for you to build.</p>
    </div>
  );
}
export default WritePage;
```

The ChatPage will be built fully in Chapter 6. For now:

```jsx
// src/pages/ChatPage.jsx
function ChatPage() {
  return (
    <div className="page">
      <h2>💬 Chat</h2>
      <p>Chat interface — coming in Chapter 6.</p>
    </div>
  );
}
export default ChatPage;
```

Add one shared style to index.css:

```css
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #e4e7f0;
}

.page p {
  color: #7b82a0;
}
```

***

## 4.4 Set Up the Router

Wrap the app in \<BrowserRouter> and define routes in App.jsx:

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ResearchPage from './pages/ResearchPage';
import WritePage from './pages/WritePage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">

        <Sidebar />

        <main className="workspace">
          <Routes>
            <Route path="/"         element={<HomePage />} />
            <Route path="/chat"     element={<ChatPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/write"    element={<WritePage />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;
```

Note: we can now remove the separate Workspace.jsx component — the \<main> element serves that role directly in App.jsx. You can delete src/components/Workspace.jsx.

***

## 4.5 Wire Up the Sidebar Navigation

Update Sidebar.jsx to use \<Link> and highlight the active route:

```jsx
// src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router';
import { useSnapshot } from 'valtio';
import { store, newThread, setActiveThread } from '../store';

const features = [
  { id: 'home',     label: '🏠 Home',     path: '/' },
  { id: 'chat',     label: '💬 Chat',     path: '/chat' },
  { id: 'research', label: '🔬 Research', path: '/research' },
  { id: 'write',    label: '✍️  Write',   path: '/write' },
];

function Sidebar() {
  const snap = useSnapshot(store);
  const location = useLocation();           // current URL

  function handleNewThread() {
    newThread();
    // Also navigate to chat route so the chat UI opens
    // We'll wire this up properly in Chapter 6
  }

  return (
    <aside className="sidebar">

      {/* ── TOP ZONE ── */}
      <div className="sidebar-features">
        <p className="sidebar-section-label">Features</p>
        <nav>
          {features.map(f => (
            <Link
              key={f.id}
              to={f.path}
              className={`sidebar-item ${
                location.pathname === f.path ? 'active' : ''
              }`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── BOTTOM ZONE ── */}
      <div className="sidebar-threads">
        <div className="sidebar-threads-header">
          <p className="sidebar-section-label">Recent chats</p>
          <button
            className="new-thread-btn"
            onClick={handleNewThread}
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
            <li className="sidebar-empty">No chats yet. Hit + to start.</li>
          )}
        </ul>
      </div>

    </aside>
  );
}

export default Sidebar;
```

Update the sidebar CSS so \<Link> (which renders as \<a>) looks the same as a \<button>:

```css
/* Add to index.css */
.sidebar-item,
a.sidebar-item {
  text-decoration: none;
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: #c5c8d8;
  font-size: 14px;
  font-family: inherit;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
```

***

## 4.6 How useLocation Works

useLocation() returns the current location object:

```js
{
  pathname: "/chat",
  search: "",
  hash: "",
  state: null
}
```

We use location.pathname === f.path to detect the active route and add the active CSS class to the matching sidebar link.

An alternative: React Router has a built-in \<NavLink> component that adds an active class automatically. We use manual comparison here to be explicit about what's happening. As an exercise, try replacing \<Link> with \<NavLink> and remove the manual active check.

> 📖 NavLink: https://reactrouter.com/en/main/components/nav-link

***

## 4.7 Navigating Programmatically

Sometimes you need to navigate from an event handler, not from a link click. Use useNavigate:

```jsx
import { useNavigate } from 'react-router';

function SomeComponent() {
  const navigate = useNavigate();

  function handleAction() {
    // ... do something
    navigate('/chat');       // push to history
    // or:
    navigate('/chat', { replace: true });  // replace, no back button
  }
}
```

We will use this in Chapter 6 when creating a new thread automatically navigates to /chat.

***

## ✅ Checkpoint

1.  Clicking Home, Chat, Research, Write in the sidebar changes the URL in the address bar
2.  The clicked item highlights (active state)
3.  The workspace content changes to match the route
4.  Using the browser's Back and Forward buttons navigates between pages correctly
5.  Refreshing the page keeps you on the same route

> ⚠️ If refresh breaks routing (shows a 404), this is a server configuration issue. With Vite's dev server it should work fine. In production, you need your server to serve index.html for all routes — this is documented in the deployment chapter of the Vite docs.

***

➡️ Next: Chapter 6 — The LLM Client