import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { createAgentTools } from "@/lib/agent/tools";
import { detectEscalationSignal } from "@/lib/demo/escalation-signals";
import {
  listConversations,
  upsertConversation,
} from "@/lib/repositories/conversations";
import type { Conversation, SupportMessage } from "@/lib/types";

export const maxDuration = 30;

function messageText(message: UIMessage) {
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

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY is missing. Add it to .env.local and restart the development server.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    id?: string;
    messages?: UIMessage[];
  };

  if (!body.id || !Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const messages = body.messages;
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const latestText = latestUserMessage ? messageText(latestUserMessage) : "";
  const escalation = detectEscalationSignal(latestText);
  const { tools, state } = createAgentTools({
    conversationId: body.id,
    latestMessage: latestText,
  });

  const result = streamText({
    model: openai(process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini"),
    system: buildSystemPrompt(escalation.directive),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    temperature: 0.2,
    onFinish: async ({ text }) => {
      const now = new Date().toISOString();
      const existing = (await listConversations()).find(
        (conversation) => conversation.id === body.id,
      );
      const allText = messages.map(messageText).join(" ");
      const orderNumber =
        state.verifiedOrder?.orderNumber ??
        allText.match(/\bFG-\d{5}\b/i)?.[0]?.toUpperCase();
      const customerEmail =
        state.verifiedOrder?.email ??
        allText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
      const firstUserText =
        messages.find((message) => message.role === "user")?.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(" ") ?? "New support conversation";

      const conversation: Conversation = {
        id: body.id!,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        status: state.ticket ? "escalated" : "resolved_by_ai",
        subject:
          firstUserText.length > 58
            ? `${firstUserText.slice(0, 58)}…`
            : firstUserText,
        customerName:
          state.verifiedOrder?.customerName ?? existing?.customerName,
        customerEmail: customerEmail ?? existing?.customerEmail,
        orderNumber: orderNumber ?? existing?.orderNumber,
        messages: toStoredMessages(messages, text),
        sources: state.sources.map(
          ({ articleId, slug, title, category }) => ({
            articleId,
            slug,
            title,
            category,
          }),
        ),
        toolsUsed: [...state.toolsUsed],
        ticketId: state.ticket?.id,
      };

      await upsertConversation(conversation);
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("Relay stream error:", error);
      return error instanceof Error
        ? error.message
        : "Relay could not complete that request.";
    },
  });
}
