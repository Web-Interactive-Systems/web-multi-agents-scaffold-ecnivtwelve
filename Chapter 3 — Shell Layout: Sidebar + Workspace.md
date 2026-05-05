---
id: ig9m8vbl127uiv74
type: NoteCard
createdAt: 2026-03-25T08:36:22.527Z
viewedAt: 2026-03-25T08:39:24.007Z
---

# Chapter 3 — Shell Layout: Sidebar + Workspace
> Goal: Build the permanent app shell — a left sidebar divided into two zones, and a center workspace area. No logic yet, just structure and CSS.

***

## 2.1 Thinking in Layout

Before writing a single line of code, sketch the layout on paper (or mentally):

```auto
┌─────────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌──────────────────────────────┐  │
│ │   SIDEBAR    │  │        WORKSPACE             │  │
│ │              │  │                              │  │
│ │  [Features]  │  │  (changes based on route)    │  │
│ │  · Home      │  │                              │  │
│ │  · Research  │  │                              │  │
│ │  · Write     │  │                              │  │
│ │──────────────│  │                              │  │
│ │  [Threads]   │  │                              │  │
│ │  · Thread 1  │  │                              │  │
│ │  · Thread 2  │  │                              │  │
│ └──────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

Key design decisions:

-   The root is a full-height flex row
-   The sidebar has a fixed width, and uses flexbox internally (column direction) to split into top/bottom zones
-   The workspace takes all remaining space (flex: 1)
-   The sidebar's two zones: the top (features list) grows to fill available space; the bottom (threads) has a fixed max-height and scrolls

***

## 2.2 The Component Files

Create two new component files:

```bash
mkdir -p src/components
touch src/components/Sidebar.jsx
touch src/components/Workspace.jsx
```

***

## 2.3 Sidebar Component

```jsx
// src/components/Sidebar.jsx

const features = [
  { id: 'home',     label: '🏠 Home' },
  { id: 'chat',     label: '💬 Chat' },
  { id: 'research', label: '🔬 Research' },
  { id: 'write',    label: '✍️  Write' },
];

const threads = [
  { id: 't1', label: 'What is quantum entanglement?' },
  { id: 't2', label: 'Write a cover letter' },
  { id: 't3', label: 'Summarize this paper' },
];

function Sidebar() {
  return (
    <aside className="sidebar">

      {/* ── TOP ZONE: app features ── */}
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

      {/* ── BOTTOM ZONE: chat threads ── */}
      <div className="sidebar-threads">
        <p className="sidebar-section-label">Recent chats</p>
        <ul>
          {threads.map(t => (
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
```

Why \<aside>? Semantic HTML. An \<aside> communicates to assistive technologies (screen readers) that this content is supplementary to the main content. \<nav> inside it tells screen readers it contains navigation links.

***

## 2.4 Workspace Component

```jsx
// src/components/Workspace.jsx

function Workspace() {
  return (
    <main className="workspace">
      <h2>Workspace</h2>
      <p>Select a feature from the sidebar.</p>
    </main>
  );
}

export default Workspace;
```

For now, this is a placeholder. In Chapter 4, the Router will render different content here based on the URL.

***

## 2.5 Rewrite App.jsx

```jsx
// src/App.jsx
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <Workspace />
    </div>
  );
}

export default App;
```

***

## 2.6 Add the CSS

Add these styles to src/index.css (append after the existing reset):

```css
/* ── App shell ── */
.app-shell {
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: 240px;
  min-width: 240px;
  background: #181b24;
  border-right: 1px solid #2a2f42;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sidebar-features {
  flex: 1;              /* takes all available space */
  overflow-y: auto;     /* scrolls if feature list is long */
  padding: 16px 12px;
}

.sidebar-threads {
  max-height: 40%;      /* never taller than 40% of the sidebar */
  overflow-y: auto;     /* scrolls independently */
  padding: 16px 12px;
  border-top: 1px solid #2a2f42;
}

.sidebar-section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7b82a0;
  margin-bottom: 8px;
}

.sidebar-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: #c5c8d8;
  font-size: 14px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.sidebar-item:hover {
  background: #2a2f42;
  color: #e4e7f0;
}

.thread-item {
  list-style: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Workspace ── */
.workspace {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  background: #0f1117;
}
```

***

## 2.7 Understanding flex: 1

A very common React layout pattern — worth understanding deeply.

When the parent is display: flex, the children line up in a row (by default). flex: 1 is shorthand for:

```css
flex-grow: 1;     /* take all remaining space */
flex-shrink: 1;   /* shrink if needed */
flex-basis: 0%;   /* start at 0 before growing */
```

In our layout:

-   The sidebar has width: 240px; min-width: 240px — it is rigid
-   The workspace has flex: 1 — it claims all remaining horizontal space
-   No matter how wide the window is, the sidebar stays 240px and the workspace fills the rest

Inside the sidebar, the same trick applies vertically (since flex-direction: column):

-   .sidebar-features has flex: 1 — it expands to fill available height
-   .sidebar-threads has max-height: 40% — it is capped, and any overflow scrolls

> 📖 CSS Flexbox guide: https://css-tricks.com/snippets/css/a-guide-to-flexbox/

***

## 2.8 Responsive Consideration (Optional)

On small screens (<600px) the sidebar takes too much space. A minimal mobile fix:

```css
@media (max-width: 600px) {
  .sidebar {
    width: 180px;
    min-width: 180px;
  }
}
```

For a full mobile experience you would hide the sidebar behind a hamburger menu — that is a project extension, not required for this course.

***

## ✅ Checkpoint

In the browser you should see:

-   A dark left sidebar (240px wide) with two sections separated by a horizontal line

    -   Top section: "Features" label + 4 buttons
    -   Bottom section: "Recent chats" label + 3 truncated thread items

-   A dark main area to the right that fills the rest of the screen

-   Hover over the sidebar buttons — they should highlight

If the sidebar and workspace are stacked vertically instead of side by side, check that .app-shell has flex-direction: row (not column).

***

➡️ Next: Chapter 4 — Global State with Valtio