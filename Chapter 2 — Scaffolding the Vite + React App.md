---
id: xqf96p8x9flq6jxw
type: NoteCard
createdAt: 2026-03-25T08:27:30.328Z
viewedAt: 2026-03-25T09:09:34.793Z
---

# Chapter 2 — Scaffolding the Vite + React App
> **Goal:** Have a running React app in the browser with a clean folder structure and a `.env` file for secrets.

***

## Dev Environment

You need to install the following on your local machine:

-   Nodejs it comes with NPM (<https://nodejs.org/en/download>)
-   IDE vscode (<https://code.visualstudio.com/>)

## 1.1 Why Vite?

Historically, the standard tool to bootstrap React apps was **Create React App (CRA)**. CRA is now deprecated and slow. **Vite** is its replacement: it uses native ES modules in the browser during development, which means the dev server starts in milliseconds and hot module replacement (HMR) is near-instant.

> 📖 Vite documentation: <https://vitejs.dev/guide/>

***

## 1.2 Create the Project

Open your terminal and run (select Yes when asked):

```bash
npm create vite@latest my-ai-app -- --template react

# User another terminal to open the app with vscode
code my-ai-app

# If code command is not working, open vscode and open the folder my-ai-app
```

What happened:

-   `npm create vite@latest` runs the official Vite project generator
-   `--template react` selects the React + JSX template (not TypeScript, keeping things simple)
-   `npm install` downloads all dependencies listed in `package.json`

You now have this structure:

```auto
my-ai-app/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   ├── App.css
│   ├── App.jsx          ← main component, we will rewrite this
│   ├── index.css        ← global styles
│   └── main.jsx         ← React entry point, mounts App into the DOM
├── index.html           ← the single HTML file Vite serves
├── package.json
└── vite.config.js
```

If you did not start the dev server when creating the app, use this command to start the server:

```bash
npm run dev
```

Open <http://localhost:5173>. You should see the Vite + React welcome page.

***

## 1.3 Install Our Dependencies

Stop the server (`Ctrl+C`) and install everything we will use throughout the course:

```bash
npm install react-router valtio openai
```

| Package        | What it does                                               |
| -------------- | ---------------------------------------------------------- |
| `react-router` | Client-side routing (URL → component)                      |
| `valtio`       | Proxy-based global state management                        |
| `openai`       | Official OpenAI JS SDK — works with Groq and LM Studio too |

> 📖 react-router-dom: <https://reactrouter.com/en/main> 📖 Valtio: <https://valtio.dev> 📖 OpenAI SDK: <https://github.com/openai/openai-node>

***

## 1.4 Create the `.env` File

Sensitive values like API keys must never be hardcoded in your source files. Vite has built-in support for `.env` files.

Create a file called `.env` at the **root** of the project (next to `package.json`):

```bash
# .env
VITE_LLM_BASE_URL=https://api.groq.com/openai/v1
VITE_LLM_API_KEY=your_groq_key_here
VITE_LLM_MODEL=openai/gpt-oss-20b
```

If you are using **LM Studio**, use these values instead:

```bash
VITE_LLM_BASE_URL=http://localhost:1234/v1
VITE_LLM_API_KEY=lm-studio
VITE_LLM_MODEL=qwen3.5-0.5b-...
```

> **Critical:** Variables exposed to the browser **must** start with `VITE_`. Any variable without that prefix is stripped from the bundle for security.

> **Never commit `.env` to git.** Make sure `.env` is listed in your `.gitignore` — Vite's template already includes it.

In your code, you access these variables like this:

```js
const apiKey = import.meta.env.VITE_LLM_API_KEY;
```

> 📖 Vite env variables: <https://vitejs.dev/guide/env-and-mode>

***

## 1.5 Clean Up the Boilerplate

The generated `App.jsx` has demo content we don't need. Replace it entirely with this minimal placeholder:

```jsx
// src/App.jsx
function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>My AI App</h1>
      <p>Setup complete. Let's build.</p>
    </div>
  );
}

export default App;
```

Also replace `src/index.css` with a basic reset we will build on:

```css
/* src/index.css */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  font-family: system-ui, sans-serif;
  background: #0f1117;
  color: #e4e7f0;
  font-size: 16px;
  line-height: 1.6;
}
```

Restart the dev server:

```bash
npm run dev
```

***

## 1.6 How `main.jsx` Works

Open `src/main.jsx`. You will see:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Three things to understand:

**`createRoot`** — This is the React API for mounting your app.

**`document.getElementById('root')`** — Looks at `index.html` for a `<div id="root">`. React renders your entire component tree inside that div.

**`<StrictMode>`** — A development-only wrapper that intentionally double-invokes renders and effects to help you catch bugs early. It has no effect in production.

> 📖 React 18 `createRoot`: <https://react.dev/reference/react-dom/client/createRoot>

***

## ✅ Checkpoint

Before moving on, verify:

1.  `npm run dev` starts without errors
2.  The browser shows **"My AI App — Setup complete. Let's build."** on a dark background
3.  The `.env` file exists at the project root and contains your LLM settings
4.  `node_modules` contains `react-router`, `valtio`, and `openai`

Check the last one:

```bash
ls node_modules | grep -E "react-router|valtio|openai"
```

You should see all three listed.

***

➡️ **Next:** [Chapter 3 — Shell Layout with Sidebar and Workspace](https://claude.ai/chat/02-layout.md)