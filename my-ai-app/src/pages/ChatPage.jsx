// src/pages/ChatPage.jsx
import { useSnapshot } from "valtio";
import { useNavigate } from "react-router";
import {
  store,
  newThread,
  addMessage,
  updateLastAssistantMessage,
  getActiveThread,
} from "../store";
import { streamCompletion } from "../lib/llmClient";
import ChatFeed from "../components/chat/ChatFeed";
import Composer from "../components/chat/Composer";

function ChatPage() {
  const snap = useSnapshot(store);
  const navigate = useNavigate();

  // Get the currently active thread (null if none)
  const activeThread =
    snap.threads.find((t) => t.id === snap.activeThreadId) ?? null;

  async function handleSend(userText) {
    // ── 1. Ensure we have an active thread ──
    let threadId = store.activeThreadId;
    if (!threadId) {
      threadId = newThread();
      navigate("/chat");
    }

    // ── 2. Add the user message to the store ──
    addMessage(threadId, "user", userText);

    // ── 3. Add an empty assistant message (will fill via streaming) ──
    addMessage(threadId, "assistant", "");

    // ── 4. Build the messages array for the API ──
    // Use the store directly (not snap) to get the latest state
    const thread = getActiveThread();
    const apiMessages = thread.messages
      .filter((m) => m.content !== "" || m.role === "user") // skip the empty assistant placeholder
      .map((m) => ({ role: m.role, content: m.content }));

    // ── 5. Mark as generating ──
    store.isGenerating = true;

    try {
      // ── 6. Stream the response ──
      await streamCompletion(apiMessages, (delta) => {
        // Called for each token — append to the last assistant message
        updateLastAssistantMessage(threadId, delta);
      });
    } catch (error) {
      console.error("LLM error:", error);
      updateLastAssistantMessage(
        threadId,
        "\n\n[Error: " + error.message + "]",
      );
    } finally {
      // ── 7. Done generating ──
      store.isGenerating = false;
    }
  }

  return (
    <div className="chat-page">
      <ChatFeed
        messages={activeThread?.messages ?? []}
        isGenerating={snap.isGenerating}
      />
      <Composer onSend={handleSend} isGenerating={snap.isGenerating} />
    </div>
  );
}

export default ChatPage;
