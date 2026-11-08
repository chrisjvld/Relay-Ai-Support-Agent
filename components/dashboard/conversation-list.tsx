"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, PackageSearch, Ticket } from "lucide-react";
import { riseIn } from "@/lib/motion";
import type { Conversation } from "@/lib/types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const TOOL_ICONS: Record<string, typeof BookOpen> = {
  searchKnowledgeBase: BookOpen,
  lookupOrder: PackageSearch,
  createSupportTicket: Ticket,
};

export function ConversationList({
  conversations,
}: {
  conversations: Conversation[];
}) {
  return (
    <article className="card">
      <header className="card-header">
        <h2>Recent conversations</h2>
        <span>{conversations.length} latest</span>
      </header>
      {conversations.length === 0 ? (
        <div className="empty-state">
          <p>No conversations yet.</p>
          <Link href="/">Open the customer chat</Link>
        </div>
      ) : (
        <ul className="list">
          <AnimatePresence initial={true}>
            {conversations.map((conversation, index) => {
              const escalated = conversation.status === "escalated";
              return (
                <motion.li
                  className="conv-row"
                  key={conversation.id}
                  layout="position"
                  {...riseIn(index)}
                >
                  <span aria-hidden="true" className="avatar">
                    {initials(conversation.customerName)}
                  </span>
                  <span className="conv-copy">
                    <strong>{conversation.subject}</strong>
                    <small>
                      {conversation.customerName ?? "Website visitor"}
                      {conversation.orderNumber
                        ? ` · ${conversation.orderNumber}`
                        : ""}
                      {conversation.toolsUsed.length > 0 && (
                        <span
                          aria-label={`Tools used: ${conversation.toolsUsed.join(", ")}`}
                          className="tools"
                        >
                          {conversation.toolsUsed.map((tool) => {
                            const Icon = TOOL_ICONS[tool];
                            return Icon ? <Icon key={tool} size={12} /> : null;
                          })}
                        </span>
                      )}
                    </small>
                  </span>
                  <span className="conv-side">
                    <span className={escalated ? "pill pill-warning" : "pill pill-success"}>
                      <span className="dot" />
                      {escalated ? "Escalated" : "Resolved by AI"}
                    </span>
                    <time dateTime={conversation.updatedAt}>
                      {formatTime(conversation.updatedAt)}
                    </time>
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </article>
  );
}
