---
id: wdu2tod7siuawsdh
type: NoteCard
createdAt: 2026-03-25T08:20:21.209Z
viewedAt: 2026-03-25T08:35:54.165Z
---

# Chapter 1: Build a Multi-Agent AI App with React
***

## What You Will Build

By the end of this small course, you will have a **fully working AI workspace app** — something like a lightweight Notion meets ChatGPT — built entirely by you, from scratch.

The app features:

-   A **left sidebar** split into two zones: app features (top) and chat thread history (bottom)
-   A **center workspace** that changes based on the active route
-   A **chat interface** with a streaming message feed and a composer
-   A **multi-agent system** where specialized AI agents collaborate on tasks
-   A **global state store** (Valtio) and **client-side router** (React Router)
-   An **OpenAI-compatible LLM client** that works with free APIs (Groq) or a local model (LM Studio)

***

## What This Course Is

This is a **travaux pratiques (TP)** — hands-on guided labs, not a lecture series. Each chapter:

1.  Explains **why** we make each design decision
2.  Shows a **minimal working code snippet** you type yourself
3.  Points you to the **official documentation** for deeper reading
4.  Ends with a **checkpoint** you can verify before moving on

> **Important:** Type the code yourself, don't copy-paste blindly. The mistakes you make while typing are where the learning happens.

***

## Prerequisites

| Skill                                     | Level needed                                                |
| ----------------------------------------- | ----------------------------------------------------------- |
| HTML / CSS                                | Basic                                                       |
| JavaScript (ES2020+)                      | Comfortable — `async/await`, arrow functions, destructuring |
| React                                     | Beginner — JSX, `useState`, `useEffect`                     |
| Terminal / /npm / yarn (we will use yarn) | Basic — you can run commands                                |

You do **not** need prior experience with AI APIs, state management libraries, or routing.

***

## Tech Stack

| Tool                        | Why we use it                                             |
| --------------------------- | --------------------------------------------------------- |
| **Vite**                    | Fastest React dev server, zero config                     |
| **React**                   | Component model, concurrent rendering                     |
| **React Router**            | Declarative client-side routing                           |
| **Valtio**                  | Proxy-based state — the simplest possible global store    |
| **OpenAI JS SDK**           | Works with OpenAI, Groq, and any OpenAI-compatible server |
| **Groq API** (or LM Studio) | Free, fast inference — no paid OpenAI key required        |

***

## LLM Options — Pick One

You need access to a language model. Choose the option that works for you:

### Option A — Groq (Recommended for beginners)

Groq offers a **free API key** with generous rate limits and very fast inference.

1.  Create a free account at [console.groq.com](http://console.groq.com)
2.  Go to **API Keys → Create API Key**
3.  Copy your key — you will use it in Chapter 5
4.  Free model available: `openai/gpt-oss-20b`

> Groq docs: <https://console.groq.com/docs/openai>

### Option B — LM Studio (No internet required)

LM Studio lets you run models **100% locally** on your own machine.

1.  Download LM Studio at [lmstudio.ai](http://lmstudio.ai)
2.  In the app, search for and download **Qwen3.5 0.5B** or **Qwen3.5 1.7B** (small and fast)
3.  Click **Local Server → Start Server** — it runs on [`http://localhost:1234`](http://localhost:1234)
4.  No API key needed — use any string as the key

> LM Studio docs: <https://lmstudio.ai/docs/local-server>

### Why are both compatible?

Both expose an API that follows the **OpenAI Chat Completions spec**. This means the same client code works with OpenAI, Groq, LM Studio, Anthropic, or any other provider. We write one client, swap the base URL and key.

***

## Folder Structure (end state)

```auto
my-ai-app/
├── public/
├── src/
│   ├── agents/
│   │   ├── orchestrator.js       ← routes tasks to sub-agents
│   │   ├── researchAgent.js
│   │   └── writerAgent.js
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Workspace.jsx
│   │   ├── chat/
│   │   │   ├── ChatFeed.jsx
│   │   │   └── Composer.jsx
│   │   └── ThreadList.jsx
│   ├── lib/
│   │   └── llmClient.js          ← OpenAI-compatible client wrapper
│   ├── store/
│   │   └── index.js              ← Valtio store (global state)
│   ├── App.jsx
│   └── main.jsx
├── .env                          ← your API key (never commit this)
├── index.html
├── package.json
└── vite.config.js
```

You will build this step by step. At the end of each chapter, your folder will grow closer to this final shape.

***

## How to Use These Notes

-   Each chapter is a standalone Markdown file
-   Work through them **in order** — each chapter depends on the previous
-   The ✅ **Checkpoint** at the end of each chapter tells you exactly what you should see
-   If something doesn't work, read the error carefully before asking for help — the terminal and browser console are your friends

***

➡️ **Next:** [Chapter 2 — Scaffolding the Vite + React app](https://claude.ai/chat/01-vite-setup.md)