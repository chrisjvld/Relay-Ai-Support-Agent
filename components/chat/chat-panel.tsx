"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  BookOpen,
  MountainSnow,
  PackageSearch,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { MessageBubble } from "./message-bubble";

const prompts = [
  {
    icon: BookOpen,
    label: "What’s your return policy for used jackets?",
  },
  {
    icon: PackageSearch,
    label: "Where is my order FG-10423?",
  },
  {
    icon: UserRound,
    label: "I need help from a person",
  },
];

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [chatId] = useState(() => `conv-${crypto.randomUUID()}`);
  const scrollAnchor = useRef<HTMLDivElement>(null);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    transport,
  });
  const isWorking = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  async function submitMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isWorking) return;
    setInput("");
    await sendMessage({ text: trimmed });
  }

  return (
    <aside className="chat-panel" aria-label="Relay support chat">
      <header className="chat-header">
        <span className="agent-avatar">
          <MountainSnow color="#174735" size={21} strokeWidth={1.8} />
        </span>
        <div className="chat-heading">
          <strong>Relay support</strong>
          <span>AI assistant · Online now</span>
        </div>
        <button
          className="header-action"
          aria-label="Start a new chat"
          onClick={() => window.location.reload()}
          type="button"
        >
          <RotateCcw size={15} />
        </button>
      </header>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <>
            <div className="welcome-block">
              <h2>Hei! How can I help?</h2>
              <p>
                I can answer product questions, explain our policies, or check
                an order for you.
              </p>
            </div>
            <div className="suggestions">
              {prompts.map(({ icon: Icon, label }) => (
                <button
                  className="suggestion"
                  disabled={isWorking}
                  key={label}
                  onClick={() => submitMessage(label)}
                  type="button"
                >
                  <span className="suggestion-icon">
                    <Icon size={15} />
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        {status === "submitted" && (
          <div className="thinking-row">
            <i />
            <i />
            <i />
            <span>Relay is thinking</span>
          </div>
        )}
        {error && (
          <div className="chat-error">
            Relay couldn’t reply. {error.message}
          </div>
        )}
        <div ref={scrollAnchor} />
      </div>

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(input);
        }}
      >
        <div className="composer-box">
          <textarea
            aria-label="Message Relay"
            disabled={isWorking}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitMessage(input);
              }
            }}
            placeholder="Ask about an order, return, or product…"
            rows={1}
            value={input}
          />
          <button
            className="send-button"
            disabled={!input.trim() || isWorking}
            type="submit"
            aria-label="Send message"
          >
            <ArrowUp size={17} />
          </button>
        </div>
        <p className="powered-by">
          Powered by Relay · Answers grounded in Fjellvik policies
        </p>
      </form>
    </aside>
  );
}
