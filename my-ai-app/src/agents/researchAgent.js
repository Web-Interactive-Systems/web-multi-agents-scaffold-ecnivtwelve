// src/agents/researchAgent.js
import { complete } from "../lib/llmClient";

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
    { role: "user", content: `Research this topic thoroughly: "${query}"` },
  ];

  const raw = await complete(messages, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.3, // lower temperature for factual tasks
  });

  try {
    const parsed = JSON.parse(raw);
    return parsed.subtopics ?? [];
  } catch (e) {
    console.error("ResearchAgent: failed to parse JSON:", raw);
    // Graceful fallback — return the raw text as a single item
    return [{ title: "Research notes", summary: raw, caveats: null }];
  }
}
