---
id: xesjjpwd980qc2vb
type: NoteCard
createdAt: 2026-03-25T08:49:15.841Z
viewedAt: 2026-03-25T08:54:58.405Z
---

# Chapter 6 — The LLM Client
> Goal: Write a thin wrapper around the OpenAI SDK that handles streaming completions and works with Groq, LM Studio, or any OpenAI-compatible API.

***

## 5.1 What is the OpenAI Chat Completions API?

The de facto standard for LLM APIs is the OpenAI Chat Completions format. Even providers that have nothing to do with OpenAI (Groq, Mistral, Ollama, LM Studio, Anthropic via proxy) implement the same API surface. This means:

-   One SDK, many providers
-   Swap the baseURL and apiKey, everything else stays the same

The core request format:

```json
{
  "model": "openai/gpt-oss-20b",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user",   "content": "What is the capital of France?" }
  ],
  "stream": true
}
```

The messages array is the complete conversation history. The API is stateless — you send the entire history every time and the model generates the next turn.

Roles:

-   system — instructions to the model (set personality, constraints, format)
-   user — the human's message
-   assistant — a previous model response (included in history for multi-turn)

> 📖 OpenAI Chat Completions reference: https://platform.openai.com/docs/api-reference/chat

***

## 5.2 Streaming

Without streaming, the API waits until the entire response is generated before returning it. For long answers this can be 10–30 seconds of blank screen.

With stream: true, the API sends Server-Sent Events (SSE): small chunks of text as they are generated, one token at a time. This lets you show text appearing progressively, like a typewriter — much better UX.

The OpenAI SDK handles SSE parsing for you. You get an async iterator:

```js
const stream = await client.chat.completions.create({
  model: 'openai/gpt-oss-20b',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content ?? '';
  // or update React state
}
```

Each chunk has a delta.content property containing the new text fragment (could be a word, a space, or a punctuation mark).

***

## 5.3 Create the LLM Client

```bash
mkdir -p src/lib
touch src/lib/llmClient.js
```

```js
// src/lib/llmClient.js
import OpenAI from 'openai';

// ── Instantiate the client once ──────────────────────────────
// The OpenAI SDK works with any OpenAI-compatible endpoint.
// We pass baseURL and apiKey from our .env file.
const client = new OpenAI({
  baseURL: import.meta.env.VITE_LLM_BASE_URL,
  apiKey:  import.meta.env.VITE_LLM_API_KEY,

  // Required for browser usage — the SDK warns about this.
  // In production you would proxy requests through your own server
  // so the API key never reaches the browser. For this course,
  // we accept the tradeoff.
  dangerouslyAllowBrowser: true,
});

const DEFAULT_MODEL = import.meta.env.VITE_LLM_MODEL;

// ── Main streaming function ──────────────────────────────────
/**
 * Send a list of messages to the LLM and stream the response.
 *
 * @param {Array}    messages      - Full conversation history (role + content)
 * @param {Function} onChunk       - Called with each text delta as it arrives
 * @param {Object}   options       - Optional overrides
 * @param {string}   options.model - Override the default model
 * @param {string}   options.systemPrompt - Override the system prompt
 * @returns {Promise<string>}      - Resolves to the full response text
 */
export async function streamCompletion(messages, onChunk, options = {}) {
  const {
    model = DEFAULT_MODEL,
    systemPrompt = 'You are a helpful, concise AI assistant.',
  } = options;

  // Build the full messages array with the system prompt prepended
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const stream = await client.chat.completions.create({
    model,
    messages: fullMessages,
    stream: true,
    max_tokens: 2048,
    temperature: 0.7,
  });

  let fullText = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      fullText += delta;
      onChunk(delta);           // notify the caller of each new fragment
    }
  }

  return fullText;
}

// ── Non-streaming version (useful for agents) ────────────────
/**
 * Send messages and wait for the complete response.
 * Useful when you don't need streaming (e.g., in agent pipelines).
 *
 * @param {Array}  messages
 * @param {Object} options
 * @returns {Promise<string>}
 */
export async function complete(messages, options = {}) {
  const {
    model = DEFAULT_MODEL,
    systemPrompt = 'You are a helpful AI assistant.',
  } = options;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await client.chat.completions.create({
    model,
    messages: fullMessages,
    stream: false,
    max_tokens: 2048,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}
```

***

## 5.4 Understanding dangerouslyAllowBrowser

By default, the OpenAI SDK throws an error when used in a browser, because it assumes you would accidentally expose your API key in the frontend bundle where anyone could extract it.

For this course, we accept this tradeoff. In a real production app, you would:

1.  Put the LLM call in a backend server (Node.js, Python FastAPI, etc.)
2.  The browser calls your backend (/api/chat)
3.  Your backend calls the LLM API with the key stored as a server environment variable
4.  The key never reaches the browser

This is the correct architecture, and building that backend is a natural extension of this project.

***

## 5.5 Test the Client in Isolation

Before wiring the client into the UI, test it from the browser console. Add a temporary test button to HomePage.jsx:

```jsx
// src/pages/HomePage.jsx
import { streamCompletion } from '../lib/llmClient';

function HomePage() {
  async function testLLM() {
    console.log('Sending test message...');
    const messages = [{ role: 'user', content: 'Say "hello world" and nothing else.' }];

    const full = await streamCompletion(
      messages,
      (delta) => console.log('delta:', delta),
    );

    console.log('Full response:', full);
  }

  return (
    <div className="page">
      <h2>Welcome</h2>
      <p>Choose a feature from the sidebar to get started.</p>
      <br />
      <button
        onClick={testLLM}
        style={{
          padding: '8px 16px',
          background: '#6c63ff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Test LLM connection
      </button>
    </div>
  );
}

export default HomePage;
```

Open the browser console (F12 → Console) and click the button. You should see the response stream in as separate delta logs, followed by the full text.

Common errors:

| Error            | Cause                 | Fix                                                 |
| ---------------- | --------------------- | --------------------------------------------------- |
| 401 Unauthorized | Wrong API key         | Check .env VITE\_LLM\_API\_KEY                      |
| 404 Not Found    | Wrong base URL        | Check .env VITE\_LLM\_BASE\_URL                     |
| CORS error       | LM Studio not running | Start the Local Server in LM Studio                 |
| model not found  | Wrong model name      | Check available models in Groq console or LM Studio |

***

## 5.6 Temperature and Other Parameters

temperature controls randomness:

| Value | Effect                                        |
| ----- | --------------------------------------------- |
| 0.0   | Deterministic — same input gives same output  |
| 0.7   | Balanced — our default                        |
| 1.0+  | Creative and varied, but may hallucinate more |

For agents that extract structured data or make decisions, use low temperature (0.1–0.3). For creative writing, use higher temperature (0.8–1.0). For chat, 0.7 is a good default.

max\_tokens caps the response length. 2048 tokens ≈ 1500 words. Increase this for longer documents.

> 📖 OpenAI API parameters: https://platform.openai.com/docs/api-reference/chat/create

***

## ✅ Checkpoint

1.  Clicking "Test LLM connection" on the home page triggers API calls (check the Network tab in DevTools)
2.  The browser console shows streaming delta chunks arriving one by one
3.  The full response is logged after all chunks arrive
4.  No CORS or auth errors

Once this works, remove the test button from HomePage.jsx — we'll build the real UI next.

***

➡️ Next: Chapter 7 — The Chat Interface