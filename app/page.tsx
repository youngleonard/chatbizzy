"use client";

import { useChat } from "@ai-sdk/react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useChat({ api: "/api/chat" });

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 16px 120px",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Chatbizzy</h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
          A RAG chatbot answering from your ingested documents.
        </p>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            No messages yet. Ask a question to get started.
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: 14,
                background:
                  m.role === "user"
                    ? "var(--user-bubble)"
                    : "var(--assistant-bubble)",
                color: m.role === "user" ? "var(--user-fg)" : "var(--fg)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Thinking…</div>
        )}

        {error && (
          <div
            style={{
              color: "#b91c1c",
              fontSize: 13,
              padding: 12,
              background: "#fee2e2",
              borderRadius: 8,
            }}
          >
            Error: {error.message}
          </div>
        )}
      </section>

      <form
        onSubmit={handleSubmit}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          background: "var(--bg)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask something…"
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              outline: "none",
              background: "#fff",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || input.trim().length === 0}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: 10,
              background: "var(--accent)",
              color: "#fff",
              opacity: isLoading || input.trim().length === 0 ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </form>
    </main>
  );
}
