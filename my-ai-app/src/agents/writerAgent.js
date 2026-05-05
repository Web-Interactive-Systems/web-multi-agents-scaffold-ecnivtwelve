// src/agents/writerAgent.js
import { complete } from "../lib/llmClient";

const SYSTEM_PROMPT = `You are a skilled technical writer. Given structured research notes,
your job is to synthesize them into a clear, well-organized response for the user.

Guidelines:
- Write in clear, accessible prose — no jargon without explanation
- Use headers (##) to organize sections when the content warrants it
- Be concise: aim for depth where it matters, not length for its own sake
- Acknowledge uncertainty honestly — don't invent facts
- End with a brief "Key takeaways" section as a bullet list
- Do NOT use any formatting (Markdown, JSON, etc.), always reply with plain text answers with no formatting whatsoever.`;

/**
 * Turn research subtopics into a polished written response.
 * @param {string} originalQuery - The user's original question
 * @param {Array}  subtopics     - Output from researchAgent
 * @returns {Promise<string>}    - Markdown-formatted response
 */
export async function synthesizeResearch(originalQuery, subtopics) {
  const researchContext = subtopics
    .map(
      (s) =>
        `### ${s.title}\n${s.summary}${s.caveats ? `\n⚠️ ${s.caveats}` : ""}`,
    )
    .join("\n\n");

  const messages = [
    {
      role: "user",
      content: `The user asked: "${originalQuery}"\n\nHere are the research notes:\n\n${researchContext}\n\nPlease write a comprehensive, well-organized response.`,
    },
  ];

  return await complete(messages, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
  });
}
