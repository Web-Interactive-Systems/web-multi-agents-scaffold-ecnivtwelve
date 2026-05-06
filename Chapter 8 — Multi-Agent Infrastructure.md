---
id: cl29rinjf20f4ldw
type: NoteCard
createdAt: 2026-03-25T08:58:36.755Z
viewedAt: 2026-03-25T09:03:47.222Z
---

# Chapter 8 — Multi-Agent Infrastructure
> Goal: Build a multi-agent system where an orchestrator decomposes a task and delegates to specialized sub-agents, then synthesizes their results. Wire this into the Research page.

***

## 7.1 What is a Multi-Agent System?

A single LLM call is one "turn": user sends a prompt, the model sends a reply. For complex tasks — research, writing long documents, software planning — a single LLM call often produces shallow or incomplete results.

A multi-agent system chains multiple LLM calls, each with a specialized focus:

```auto
User query: "Explain the economic impact of remote work"
         │
         ▼
   ┌─────────────────────────────────────────────────────┐
   │              ORCHESTRATOR                           │
   │  Reads query, creates a plan, delegates subtasks    │
   └──────────────┬──────────────────────────────────────┘
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
 ResearchAgent  DataAgent  SynthesisAgent
  (finds key    (finds     (combines into
   concepts)    metrics)    a summary)
       │          │          │
       └──────────┴──────────┘
                  │
                  ▼
   ┌─────────────────────────────────────────────────────┐
   │              SYNTHESIZER                            │
   │  Combines sub-agent outputs into final response     │
   └─────────────────────────────────────────────────────┘
```

Each agent is just a function that:

1.  Takes a task description
2.  Calls complete() with a specialized system prompt
3.  Returns a string result

Agents are stateless — they don't remember previous calls. The orchestrator manages state.

***

## 7.2 Agent Design Principles

Single responsibility: Each agent does one thing well. A research agent shouldn't also write prose. A writer agent shouldn't fact-check.

Explicit prompting: Each agent has a detailed system prompt describing exactly its role, output format, and constraints. Vague prompts = vague results.

Structured output: When agents need to communicate with each other (not just with the user), ask them to output JSON. Structured data is easier to parse and compose than prose.

Graceful failure: Any agent call can fail (network error, hallucination, timeout). The orchestrator must handle partial failures — a degraded answer is better than a crash.

***

## 7.3 Create the Agent Files

Use vscode or terminal to create files:

```bash
mkdir -p src/agents
touch src/agents/orchestrator.js
touch src/agents/researchAgent.js
touch src/agents/writerAgent.js
touch src/agents/factCheckAgent.js
```

***

## 7.4 The Research Agent

```js
// src/agents/researchAgent.js
import { complete } from '../lib/llmClient';

const SYSTEM_PROMPT = `You are a research analyst. Given a topic or question, your job is to:
1. Identify the 3-5 most important subtopics or angles to explore
2. For each subtopic, provide a concise, factual overview (2-4 sentences)
3. Note any important caveats, uncertainties, or areas of active debate

Output format — respond with valid JSON only, no markdown fences:
{
  "subtopics": [
    {
      "title": "string",
      "summary": "string",
      "caveats": "string or null"
    }
  ]
}`;

/**
 * Research a topic and return structured subtopics.
 * @param {string} query - The topic to research
 * @returns {Promise<Array>} - Array of subtopic objects
 */
export async function researchTopic(query) {
  const messages = [
    { role: 'user', content: `Research this topic thoroughly: "${query}"` }
  ];

  const raw = await complete(messages, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.3,    // lower temperature for factual tasks
  });

  try {
    const parsed = JSON.parse(raw);
    return parsed.subtopics ?? [];
  } catch (e) {
    console.error('ResearchAgent: failed to parse JSON:', raw);
    // Graceful fallback — return the raw text as a single item
    return [{ title: 'Research notes', summary: raw, caveats: null }];
  }
}
```

***

## 7.5 The Writer Agent

```js
// src/agents/writerAgent.js
import { complete } from '../lib/llmClient';

const SYSTEM_PROMPT = `You are a skilled technical writer. Given structured research notes,
your job is to synthesize them into a clear, well-organized response for the user.

Guidelines:
- Write in clear, accessible prose — no jargon without explanation
- Use headers (##) to organize sections when the content warrants it
- Be concise: aim for depth where it matters, not length for its own sake
- Acknowledge uncertainty honestly — don't invent facts
- End with a brief "Key takeaways" section as a bullet list`;

/**
 * Turn research subtopics into a polished written response.
 * @param {string} originalQuery - The user's original question
 * @param {Array}  subtopics     - Output from researchAgent
 * @returns {Promise<string>}    - Markdown-formatted response
 */
export async function synthesizeResearch(originalQuery, subtopics) {
  const researchContext = subtopics
    .map(s => `### ${s.title}\n${s.summary}${s.caveats ? `\n⚠️ ${s.caveats}` : ''}`)
    .join('\n\n');

  const messages = [
    {
      role: 'user',
      content: `The user asked: "${originalQuery}"\n\nHere are the research notes:\n\n${researchContext}\n\nPlease write a comprehensive, well-organized response.`,
    }
  ];

  return await complete(messages, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
  });
}
```

***

## 7.6 The Fact-Check Agent (Optional / Advanced)

```js
// src/agents/factCheckAgent.js
import { complete } from '../lib/llmClient';

const SYSTEM_PROMPT = `You are a critical fact-checker. Given a piece of text,
identify any claims that are:
- Potentially inaccurate or misleading
- Stated with more confidence than warranted
- Missing important context

Output valid JSON only:
{
  "concerns": [
    {
      "claim": "the claim as written",
      "issue": "why this is problematic",
      "severity": "low | medium | high"
    }
  ],
  "overall": "brief overall assessment"
}
If no concerns, return { "concerns": [], "overall": "No significant issues found." }`;

export async function factCheck(text) {
  const messages = [
    { role: 'user', content: `Fact-check the following text:\n\n${text}` }
  ];

  const raw = await complete(messages, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.1,   // very low — we want consistent, conservative output
  });

  try {
    return JSON.parse(raw);
  } catch {
    return { concerns: [], overall: 'Unable to parse fact-check results.' };
  }
}
```

***

## 7.7 The Orchestrator

The orchestrator coordinates the agents. It decides which agents to run, in what order, and how to combine their outputs.

```js
// src/agents/orchestrator.js
import { researchTopic } from './researchAgent';
import { synthesizeResearch } from './writerAgent';
import { factCheck } from './factCheckAgent';

/**
 * Run the full multi-agent research pipeline.
 *
 * @param {string}   query        - The user's question
 * @param {Function} onProgress   - Called with status updates for the UI
 * @param {Object}   options
 * @param {boolean}  options.factCheck - Whether to run the fact-check agent
 * @returns {Promise<{response: string, factCheckResult: object|null}>}
 */
export async function runResearchPipeline(query, onProgress, options = {}) {
  const { runFactCheck = false } = options;

  // ── Step 1: Research ─────────────────────────────────────
  onProgress({ step: 'research', status: 'running', message: '🔬 Researching the topic...' });

  let subtopics;
  try {
    subtopics = await researchTopic(query);
    onProgress({
      step: 'research',
      status: 'done',
      message: `✅ Found ${subtopics.length} subtopics`,
      data: subtopics,
    });
  } catch (error) {
    onProgress({ step: 'research', status: 'error', message: '❌ Research failed: ' + error.message });
    throw error;
  }

  // ── Step 2: Write ─────────────────────────────────────────
  onProgress({ step: 'write', status: 'running', message: '✍️ Synthesizing response...' });

  let response;
  try {
    response = await synthesizeResearch(query, subtopics);
    onProgress({ step: 'write', status: 'done', message: '✅ Response ready' });
  } catch (error) {
    onProgress({ step: 'write', status: 'error', message: '❌ Writing failed: ' + error.message });
    throw error;
  }

  // ── Step 3: Fact check (optional) ────────────────────────
  let factCheckResult = null;
  if (runFactCheck) {
    onProgress({ step: 'factcheck', status: 'running', message: '🔍 Fact-checking...' });
    try {
      factCheckResult = await factCheck(response);
      const concerns = factCheckResult.concerns.length;
      onProgress({
        step: 'factcheck',
        status: 'done',
        message: concerns > 0
          ? `⚠️ Found ${concerns} concern(s)`
          : '✅ No significant issues found',
      });
    } catch (error) {
      onProgress({ step: 'factcheck', status: 'error', message: '❌ Fact-check failed' });
      // Not critical — continue without fact-check
    }
  }

  return { response, subtopics, factCheckResult };
}
```

Why onProgress callbacks? The pipeline takes several seconds (multiple LLM calls). Without progress updates, the UI would show a blank spinner. By calling onProgress after each agent finishes, we can show the user what's happening — "Researching... ✅ Writing... ✅ Fact-checking..."

***

## 7.8 The Research Page UI

```jsx
// src/pages/ResearchPage.jsx
import { useState } from 'react';
import { runResearchPipeline } from '../agents/orchestrator';

function ProgressLog({ steps }) {
  if (steps.length === 0) return null;
  return (
    <div className="progress-log">
      {steps.map((step, i) => (
        <div key={i} className={`progress-step status-${step.status}`}>
          {step.message}
        </div>
      ))}
    </div>
  );
}

function ResearchPage() {
  const [query, setQuery] = useState('');
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  function addStep(step) {
    setSteps(prev => [...prev, step]);
  }

  async function handleResearch() {
    if (!query.trim() || isRunning) return;

    setSteps([]);
    setResult(null);
    setIsRunning(true);

    try {
      const { response, subtopics } = await runResearchPipeline(
        query,
        addStep,
        { runFactCheck: false }   // set to true to enable fact-checking
      );
      setResult(response);
    } catch (error) {
      addStep({ step: 'error', status: 'error', message: 'Pipeline failed: ' + error.message });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="page research-page">
      <h2>🔬 Multi-Agent Research</h2>
      <p className="page-subtitle">
        Ask a complex question. Three AI agents collaborate: a researcher, a writer, and optionally a fact-checker.
      </p>

      <div className="research-input-row">
        <input
          type="text"
          className="research-input"
          placeholder="e.g. What are the tradeoffs of microservices vs monoliths?"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleResearch()}
          disabled={isRunning}
        />
        <button
          className="research-btn"
          onClick={handleResearch}
          disabled={!query.trim() || isRunning}
        >
          {isRunning ? 'Researching…' : 'Research'}
        </button>
      </div>

      <ProgressLog steps={steps} />

      {result && (
        <div className="research-result">
          {/* Render markdown as preformatted text for now
              For rich rendering, install react-markdown:
              npm install react-markdown
              then: import ReactMarkdown from 'react-markdown'
              <ReactMarkdown>{result}</ReactMarkdown>
          */}
          <pre className="research-output">{result}</pre>
        </div>
      )}
    </div>
  );
}

export default ResearchPage;
```

Add the research page styles:

```css
/* ── Research page ── */
.research-page {
  max-width: 820px;
}

.page-subtitle {
  color: #7b82a0;
  margin-bottom: 24px;
}

.research-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.research-input {
  flex: 1;
  background: #181b24;
  border: 1px solid #2a2f42;
  border-radius: 8px;
  color: #e4e7f0;
  font-size: 15px;
  font-family: inherit;
  padding: 10px 14px;
  outline: none;
}

.research-input:focus { border-color: #6c63ff; }
.research-input:disabled { opacity: 0.5; }

.research-btn {
  padding: 10px 20px;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.research-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Progress log ── */
.progress-log {
  background: #181b24;
  border: 1px solid #2a2f42;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-step {
  font-size: 13px;
  padding: 4px 0;
}

.progress-step.status-running { color: #ffa94d; }
.progress-step.status-done    { color: #34d399; }
.progress-step.status-error   { color: #f87171; }

/* ── Research result ── */
.research-result {
  border: 1px solid #2a2f42;
  border-radius: 10px;
  overflow: hidden;
}

.research-output {
  padding: 24px;
  font-size: 14px;
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  color: #e4e7f0;
  background: #181b24;
}
```

***

## 7.9 Parallelizing Agents with Promise.all

The current pipeline runs agents sequentially: research → write → fact-check. For some pipelines, you can run independent agents in parallel:

```js
// If you had two independent research subtasks:
const [subtopicsA, subtopicsB] = await Promise.all([
  researchTopic('economic impact of AI'),
  researchTopic('social impact of AI'),
]);
```

Promise.all runs both LLM calls at the same time and waits for both to finish. This roughly halves the waiting time when calls are independent. Use it whenever agents don't depend on each other's output.

***

## ✅ Checkpoint

1.  Navigate to /research
2.  Type a complex question and click Research
3.  Watch the progress log update: Research → Write
4.  The final response appears below the progress log
5.  Ask another question — the log and result reset cleanly

Experiment: Change runFactCheck: false to runFactCheck: true and ask a question. Watch a third agent run after the first two.

***

➡️ Next: Chapter 8 — Next Steps & Project Ideas
