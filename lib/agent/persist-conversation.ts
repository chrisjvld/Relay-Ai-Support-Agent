import "server-only";

import type { UIMessage } from "ai";
import type { AgentRunState } from "@/lib/agent/tools";
import {
  listConversations,
  upsertConversation,
} from "@/lib/repositories/conversations";
import type { Conversation, SupportMessage } from "@/lib/types";

export function messageText(message: UIMessage) {
  return message.parts
    .filter(
      (part): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function toStoredMessages(messages: UIMessage[], assistantText: string) {
  const now = new Date().toISOString();
  const stored: SupportMessage[] = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: messageText(message),
      createdAt: now,
    }))
    .filter((message) => message.content);

  if (assistantText.trim()) {
    stored.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: assistantText.trim(),
      createdAt: now,
    });
  }

  return stored;
}

/**
 * Saves the finished turn to the local conversation store so the support
 * dashboard can show it. Shared by the live model route and demo playback.
 */
export async function persistConversation({
  id,
  messages,
  assistantText,
  state,
}: {
  id: string;
  messages: UIMessage[];
  assistantText: string;
  state: AgentRunState;
}) {
  const now = new Date().toISOString();
  const existing = (await listConversations()).find(
    (conversation) => conversation.id === id,
  );
  const allText = messages.map(messageText).join(" ");
  const orderNumber =
    state.verifiedOrder?.orderNumber ??
    allText.match(/\bFG-\d{5}\b/i)?.[0]?.toUpperCase();
  const customerEmail =
    state.verifiedOrder?.email ??
    allText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  const firstUserText =
    messages
      .find((message) => message.role === "user")
      ?.parts.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ") ?? "New support conversation";

  const conversation: Conversation = {
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    status: state.ticket ? "escalated" : "resolved_by_ai",
    subject:
      firstUserText.length > 58
        ? `${firstUserText.slice(0, 58)}…`
        : firstUserText,
    customerName: state.verifiedOrder?.customerName ?? existing?.customerName,
    customerEmail: customerEmail ?? existing?.customerEmail,
    orderNumber: orderNumber ?? existing?.orderNumber,
    messages: toStoredMessages(messages, assistantText),
    sources: state.sources.map(({ articleId, slug, title, category }) => ({
      articleId,
      slug,
      title,
      category,
    })),
    toolsUsed: [...state.toolsUsed],
    ticketId: state.ticket?.id,
  };

  await upsertConversation(conversation);
}
