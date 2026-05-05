// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router";
import { useSnapshot } from "valtio";
import { store, newThread, setActiveThread } from "../store";

const features = [
  { id: "home", label: "🏠 Home", path: "/" },
  { id: "chat", label: "💬 Chat", path: "/chat" },
  { id: "research", label: "🔬 Research", path: "/research" },
  { id: "write", label: "✍️  Write", path: "/write" },
];

function Sidebar() {
  const snap = useSnapshot(store);
  const location = useLocation(); // current URL

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
          {features.map((f) => (
            <Link
              key={f.id}
              to={f.path}
              className={`sidebar-item ${
                location.pathname === f.path ? "active" : ""
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
          {snap.threads.map((thread) => (
            <li
              key={thread.id}
              className={`sidebar-item thread-item ${
                thread.id === snap.activeThreadId ? "active" : ""
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
