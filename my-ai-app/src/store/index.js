// src/store/index.js
import { proxy } from "valtio";

// ── Thread shape ─────────────────────────────────────────────
// A thread is a conversation. It contains an array of messages.
// Each message has: id, role ('user' | 'assistant'), content, timestamp.

function createMessage(role, content) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: Date.now(),
  };
}

function createThread(title = "New chat") {
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: Date.now(),
  };
}

// ── The global store ─────────────────────────────────────────
export const store = proxy({
  // Which thread is currently open (null = no chat open)
  activeThreadId: null,

  // All chat threads
  threads: [],

  // Is the LLM currently generating a response?
  isGenerating: false,

  // UI state: which sidebar panel is visible on mobile
  sidebarOpen: true,
});

// ── Actions ──────────────────────────────────────────────────
// Actions are plain functions that mutate the store.
// We export them alongside the store so components import
// what they need without knowing how the store is structured.

export function newThread() {
  const thread = createThread();
  store.threads.unshift(thread); // add to top of list
  store.activeThreadId = thread.id;
  return thread.id;
}

export function setActiveThread(threadId) {
  store.activeThreadId = threadId;
}

export function addMessage(threadId, role, content) {
  const thread = store.threads.find((t) => t.id === threadId);
  if (!thread) return;

  const message = createMessage(role, content);
  thread.messages.push(message);

  // Auto-title the thread from the first user message
  if (role === "user" && thread.messages.length === 1) {
    thread.title = content.slice(0, 60);
  }

  return message.id;
}

export function updateLastAssistantMessage(threadId, contentChunk) {
  // Used during streaming to append tokens to the last message
  const thread = store.threads.find((t) => t.id === threadId);
  if (!thread) return;

  const lastMsg = thread.messages[thread.messages.length - 1];
  if (lastMsg?.role === "assistant") {
    lastMsg.content += contentChunk;
  }
}

export function getActiveThread() {
  return store.threads.find((t) => t.id === store.activeThreadId) ?? null;
}

// Export helpers so other modules can create typed objects consistently
export { createMessage, createThread };
