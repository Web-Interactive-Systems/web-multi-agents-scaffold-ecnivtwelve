// src/agents/factCheckAgent.js
import { complete } from "../lib/llmClient";

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
    { role: "user", content: `Fact-check the following text:\n\n${text}` },
  ];

  const raw = await complete(messages, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.1, // very low — we want consistent, conservative output
  });

  try {
    return JSON.parse(raw);
  } catch {
    return { concerns: [], overall: "Unable to parse fact-check results." };
  }
}
