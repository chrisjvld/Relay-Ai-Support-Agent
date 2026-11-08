"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUp,
  BookOpen,
  ChevronDown,
  CircleAlert,
  Headset,
  PackageSearch,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { RelayMark } from "@/components/brand/relay-mark";
import { press, riseIn, sheetSpring, spring } from "@/lib/motion";
import { MessageBubble } from "./message-bubble";

const starterPrompts = [
  { icon: BookOpen, label: "What’s your return policy for used jackets?" },
  { icon: PackageSearch, label: "Where is my order FG-10423?" },
  { icon: UserRound, label: "I need help from a person" },
];

function newChatId() {
  return `conv-${crypto.randomUUID()}`;
}

function findTicketId(messages: UIMessage[]) {
  for (const message of messages) {
    for (const part of message.parts) {
      if (
        isToolUIPart(part) &&
        getToolName(part) === "createSupportTicket" &&
        part.state === "output-available"
      ) {
        return (part.output as { ticketId?: string }).ticketId ?? "ticket";
      }
    }
  }
  return null;
}

function hasVerifiedOrder(messages: UIMessage[]) {
  return messages.some((message) =>
    message.parts.some(
      (part) =>
        isToolUIPart(part) &&
        getToolName(part) === "lookupOrder" &&
        part.state === "output-available" &&
        (part.output as { found?: boolean }).found,
    ),
  );
}

/** Re-checks of an order already shown keep their status row but not a second card. */
function repeatedOrderCards(messages: UIMessage[]) {
  const shown = new Set<string>();
  const hidden = new Set<string>();
  for (const message of messages) {
    for (const part of message.parts) {
      if (
        isToolUIPart(part) &&
        getToolName(part) === "lookupOrder" &&
        part.state === "output-available"
      ) {
        const order = (part.output as { order?: { orderNumber: string } }).order;
        if (!order) continue;
        if (shown.has(order.orderNumber)) hidden.add(part.toolCallId);
        shown.add(order.orderNumber);
      }
    }
  }
  return hidden;
}

/** Follow-up chips: unused starters, plus the natural next step of the demo. */
function followUps(messages: UIMessage[]) {
  const asked = new Set(
    messages
      .filter((message) => message.role === "user")
      .flatMap((message) =>
        message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])),
      ),
  );
  const chips: string[] = [];
  const last = messages[messages.length - 1];
  const lastText =
    last?.role === "assistant"
      ? last.parts.map((part) => (part.type === "text" ? part.text : "")).join(" ")
      : "";

  if (/email/i.test(lastText) && /FG-10423/i.test([...asked].join(" "))) {
    chips.push("ida@example.com");
  }
  if (hasVerifiedOrder(messages)) {
    chips.push("This is the second time my order is late, I want a refund now");
  }
  for (const prompt of starterPrompts) {
    if (!asked.has(prompt.label)) chips.push(prompt.label);
  }
  return chips.filter((chip) => !asked.has(chip)).slice(0, 3);
}

export function ChatPanel({ demo = false }: { demo?: boolean }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(newChatId);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );
  const { messages, sendMessage, status, error, stop } = useChat({
    id: chatId,
    transport,
  });
  const isWorking = status === "submitted" || status === "streaming";
  const ticketId = findTicketId(messages);
  const suggestions = messages.length > 0 && !isWorking ? followUps(messages) : [];

  // Keep the newest content in view while it streams, unless the reader has
  // scrolled up to look at something earlier.
  useEffect(() => {
    const scroller = scrollRef.current;
    const thread = threadRef.current;
    if (!scroller || !thread) return;

    const onScroll = () => {
      const distance =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      pinnedToBottom.current = distance < 48;
    };
    const observer = new ResizeObserver(() => {
      if (pinnedToBottom.current) {
        scroller.scrollTo({ top: scroller.scrollHeight });
      }
    });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(thread);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  function closePanel() {
    setOpen(false);
    launcherRef.current?.focus({ preventScroll: true });
  }

  async function submitMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isWorking) return;
    setInput("");
    pinnedToBottom.current = true;
    await sendMessage({ text: trimmed });
  }

  function startNewChat() {
    if (isWorking) stop();
    setInput("");
    setChatId(newChatId());
    textareaRef.current?.focus();
  }

  const lastMessage = messages[messages.length - 1];
  const hiddenResults = repeatedOrderCards(messages);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label="Relay support chat"
            aria-modal="false"
            className="chat-panel"
            exit={{ opacity: 0, scale: 0.4, y: 16 }}
            initial={{ opacity: 0, scale: 0.4, y: 16 }}
            key="panel"
            onAnimationComplete={() => {
              if (open) textareaRef.current?.focus({ preventScroll: true });
            }}
            role="dialog"
            transition={sheetSpring}
          >
            <header className="chat-header">
              <RelayMark size={34} />
              <div className="chat-heading">
                <strong>Fjellvik Support</strong>
                <div
                  aria-live="polite"
                  className="chat-status"
                  data-escalated={Boolean(ticketId)}
                >
                  <span className="dot" />
                  <motion.span
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 4 }}
                    key={ticketId ? "handoff" : isWorking ? "working" : "idle"}
                    transition={spring}
                  >
                    {ticketId
                      ? `With a specialist · ${ticketId}`
                      : isWorking
                        ? "Relay is working…"
                        : "Relay AI · Replies instantly"}
                  </motion.span>
                </div>
              </div>
              <motion.button
                aria-label="Start a new chat"
                className="icon-button"
                onClick={startNewChat}
                title="New chat"
                type="button"
                whileTap={press}
              >
                <RotateCcw size={16} />
              </motion.button>
              <motion.button
                aria-label="Close chat"
                className="icon-button"
                onClick={closePanel}
                title="Close"
                type="button"
                whileTap={press}
              >
                <ChevronDown size={18} />
              </motion.button>
            </header>

            <div className="chat-scroll" ref={scrollRef}>
              <div className="chat-thread" ref={threadRef}>
                {messages.length === 0 ? (
                  <motion.div key={chatId} {...riseIn()}>
                    <div className="welcome">
                      <RelayMark size={44} />
                      <h2>Hi, I’m Relay.</h2>
                      <p>
                        I can answer questions from Fjellvik’s help centre,
                        check an order, or hand you to a person.
                      </p>
                    </div>
                    <p className="suggestions-label">Try asking</p>
                    <div className="suggestions">
                      {starterPrompts.map(({ icon: Icon, label }, index) => (
                        <motion.button
                          className="suggestion-chip"
                          disabled={isWorking}
                          key={label}
                          onClick={() => submitMessage(label)}
                          type="button"
                          whileTap={press}
                          {...riseIn(index + 2, 0.05)}
                        >
                          <Icon size={15} />
                          {label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      hiddenResults={hiddenResults}
                      key={message.id}
                      message={message}
                      streaming={
                        status === "streaming" && message.id === lastMessage?.id
                      }
                    />
                  ))
                )}

                <AnimatePresence>
                  {status === "submitted" && (
                    <motion.div
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="thinking"
                      exit={{ opacity: 0, scale: 0.96 }}
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      key="thinking"
                      role="status"
                      style={{ transformOrigin: "0% 100%" }}
                      transition={spring}
                    >
                      <span aria-hidden="true" className="thinking-dots">
                        <i />
                        <i />
                        <i />
                      </span>
                      Reading your message
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div className="chat-error" role="alert" {...riseIn()}>
                    <CircleAlert size={15} />
                    <span>Relay couldn’t reply. {error.message}</span>
                  </motion.div>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {ticketId && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="handoff-banner"
                  exit={{ opacity: 0, y: 8 }}
                  initial={{ opacity: 0, y: 8 }}
                  key="handoff"
                  transition={spring}
                >
                  <Headset size={15} />
                  <span>
                    A specialist will reply by email. You can keep chatting
                    meanwhile.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage(input);
              }}
            >
              <AnimatePresence initial={false}>
                {suggestions.length > 0 && (
                  <motion.div
                    animate={{ opacity: 1, height: "auto" }}
                    className="suggestions compact"
                    exit={{ opacity: 0, height: 0 }}
                    initial={{ opacity: 0, height: 0 }}
                    key="followups"
                    style={{ marginBottom: 8 }}
                    transition={spring}
                  >
                    {suggestions.map((label, index) => (
                      <motion.button
                        className="suggestion-chip"
                        key={label}
                        onClick={() => submitMessage(label)}
                        type="button"
                        whileTap={press}
                        {...riseIn(index, 0.05)}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="composer-field">
                <label className="sr-only" htmlFor="relay-input">
                  Message Relay
                </label>
                <textarea
                  id="relay-input"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      submitMessage(input);
                    }
                  }}
                  placeholder="Ask about an order, return or product"
                  ref={textareaRef}
                  rows={1}
                  value={input}
                />
                <motion.button
                  aria-label="Send message"
                  className="send-button"
                  disabled={!input.trim() || isWorking}
                  type="submit"
                  whileTap={press}
                >
                  <ArrowUp size={18} strokeWidth={2.25} />
                </motion.button>
              </div>
              <p className="composer-meta">
                Answers grounded in Fjellvik’s help centre
                {demo && (
                  <span
                    className="demo-badge"
                    title="Scripted playback: no OpenAI key is configured, or DEMO_MODE=1"
                  >
                    Demo mode
                  </span>
                )}
              </p>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.button
        aria-expanded={open}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="chat-launcher"
        data-open={open}
        layout
        onClick={() => (open ? closePanel() : setOpen(true))}
        ref={launcherRef}
        transition={spring}
        type="button"
        whileTap={press}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {open ? (
            <motion.span
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              className="launcher-icon"
              exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
              initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
              key="close"
              transition={spring}
            >
              <ChevronDown size={22} />
            </motion.span>
          ) : (
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              initial={{ opacity: 0, scale: 0.6 }}
              key="open"
              style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
              transition={spring}
            >
              <RelayMark size={36} />
              Ask Relay
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
