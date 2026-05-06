// src/agents/orchestrator.js
import { researchTopic } from "./researchAgent";
import { synthesizeResearch } from "./writerAgent";
import { factCheck } from "./factCheckAgent";

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
  const { runFactCheck = true } = options;

  // ── Step 1: Research ─────────────────────────────────────
  onProgress({
    step: "research",
    status: "running",
    message: "🔬 Researching the topic...",
  });

  let subtopics;
  try {
    subtopics = await researchTopic(query);
    onProgress({
      step: "research",
      status: "done",
      message: `✅ Found ${subtopics.length} subtopics`,
      data: subtopics,
    });
  } catch (error) {
    onProgress({
      step: "research",
      status: "error",
      message: "❌ Research failed: " + error.message,
    });
    throw error;
  }

  // ── Step 2: Write ─────────────────────────────────────────
  onProgress({
    step: "write",
    status: "running",
    message: "✍️ Synthesizing response...",
  });

  let response;
  try {
    response = await synthesizeResearch(query, subtopics);
    onProgress({ step: "write", status: "done", message: "✅ Response ready" });
  } catch (error) {
    onProgress({
      step: "write",
      status: "error",
      message: "❌ Writing failed: " + error.message,
    });
    throw error;
  }

  // ── Step 3: Fact check (optional) ────────────────────────
  let factCheckResult = null;
  if (runFactCheck) {
    onProgress({
      step: "factcheck",
      status: "running",
      message: "🔍 Fact-checking...",
    });
    try {
      factCheckResult = await factCheck(response);
      const concerns = factCheckResult.concerns.length;
      onProgress({
        step: "factcheck",
        status: "done",
        message:
          concerns > 0
            ? `⚠️ Found ${concerns} concern(s)`
            : "✅ No significant issues found",
      });
    } catch (error) {
      onProgress({
        step: "factcheck",
        status: "error",
        message: "❌ Fact-check failed",
      });
      // Not critical — continue without fact-check
    }
  }

  return { response, subtopics, factCheckResult };
}
