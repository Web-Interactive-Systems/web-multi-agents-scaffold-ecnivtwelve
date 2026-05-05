// src/pages/ResearchPage.jsx
import { useState } from "react";
import { runResearchPipeline } from "../agents/orchestrator";

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
  const [query, setQuery] = useState("");
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  function addStep(step) {
    setSteps((prev) => [...prev, step]);
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
        { runFactCheck: false }, // set to true to enable fact-checking
      );
      setResult(response);
    } catch (error) {
      addStep({
        step: "error",
        status: "error",
        message: "Pipeline failed: " + error.message,
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="page research-page">
      <h2>🔬 Multi-Agent Research</h2>
      <p className="page-subtitle">
        Ask a complex question. Three AI agents collaborate: a researcher, a
        writer, and optionally a fact-checker.
      </p>

      <div className="research-input-row">
        <input
          type="text"
          className="research-input"
          placeholder="e.g. What are the tradeoffs of microservices vs monoliths?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleResearch()}
          disabled={isRunning}
        />
        <button
          className="research-btn"
          onClick={handleResearch}
          disabled={!query.trim() || isRunning}
        >
          {isRunning ? "Researching…" : "Research"}
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
