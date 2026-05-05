// src/pages/HomePage.jsx
import { streamCompletion } from "../lib/llmClient";

function HomePage() {
  async function testLLM() {
    console.log("Sending test message...");
    const messages = [
      { role: "user", content: 'Say "hello world" and nothing else.' },
    ];

    const full = await streamCompletion(messages, (delta) =>
      console.log("delta:", delta),
    );

    console.log("Full response:", full);
  }

  return (
    <div className="page">
      <h2>Welcome</h2>
      <p>Choose a feature from the sidebar to get started.</p>
      <br />
      <button
        onClick={testLLM}
        style={{
          padding: "8px 16px",
          background: "#6c63ff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Test LLM connection
      </button>
    </div>
  );
}

export default HomePage;
