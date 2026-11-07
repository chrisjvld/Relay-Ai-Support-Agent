import { Bot, CircleUserRound, Headphones } from "lucide-react";
import type { Conversation } from "@/lib/types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ConversationList({
  conversations,
}: {
  conversations: Conversation[];
}) {
  return (
    <article className="dashboard-card">
      <header className="card-header">
        <h2>Recent conversations</h2>
        <span>Latest activity</span>
      </header>
      {conversations.length === 0 ? (
        <div className="empty-state">No support conversations yet.</div>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => (
            <div className="conversation-row" key={conversation.id}>
              <span className="customer-avatar">
                <CircleUserRound size={17} />
              </span>
              <span className="conversation-copy">
                <strong>{conversation.subject}</strong>
                <small>
                  {conversation.customerName ?? "Website customer"}
                  {conversation.orderNumber
                    ? ` · ${conversation.orderNumber}`
                    : ""}
                </small>
              </span>
              <span
                className={`resolution-badge ${
                  conversation.status === "escalated" ? "escalated" : ""
                }`}
              >
                {conversation.status === "escalated" ? (
                  <Headphones size={11} />
                ) : (
                  <Bot size={11} />
                )}
                {conversation.status === "escalated" ? "Escalated" : "AI resolved"}
              </span>
              <time>{formatTime(conversation.updatedAt)}</time>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
