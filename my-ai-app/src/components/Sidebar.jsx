// src/components/Sidebar.jsx

const features = [
  { id: "home", label: "🏠 Home" },
  { id: "chat", label: "💬 Chat" },
  { id: "research", label: "🔬 Research" },
  { id: "write", label: "✍️  Write" },
];

const threads = [
  { id: "t1", label: "What is quantum entanglement?" },
  { id: "t2", label: "Write a cover letter" },
  { id: "t3", label: "Summarize this paper" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      {/* ── TOP ZONE: app features ── */}
      <div className="sidebar-features">
        <p className="sidebar-section-label">Features</p>
        <nav>
          {features.map((f) => (
            <button key={f.id} className="sidebar-item">
              {f.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── BOTTOM ZONE: chat threads ── */}
      <div className="sidebar-threads">
        <p className="sidebar-section-label">Recent chats</p>
        <ul>
          {threads.map((t) => (
            <li key={t.id} className="sidebar-item thread-item">
              {t.label}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
