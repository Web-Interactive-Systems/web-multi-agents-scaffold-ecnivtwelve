// src/lib/llmClient.js
import OpenAI from "openai";

// ── Instantiate the client once ──────────────────────────────
// The OpenAI SDK works with any OpenAI-compatible endpoint.
// We pass baseURL and apiKey from our .env file.
const client = new OpenAI({
  baseURL: import.meta.env.VITE_LLM_BASE_URL,
  apiKey: import.meta.env.VITE_LLM_API_KEY,

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
    systemPrompt = "You are a helpful, concise AI assistant.",
  } = options;

  // Build the full messages array with the system prompt prepended
  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const stream = await client.chat.completions.create({
    model,
    messages: fullMessages,
    stream: true,
    max_tokens: 2048,
    temperature: 0.7,
  });

  let fullText = "";

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullText += delta;
      onChunk(delta); // notify the caller of each new fragment
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
    systemPrompt = "You are a helpful AI assistant.",
  } = options;

  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const response = await client.chat.completions.create({
    model,
    messages: fullMessages,
    stream: false,
    max_tokens: 2048,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}
