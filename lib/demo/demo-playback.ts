import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  type UIMessageStreamWriter,
} from "ai";
import {
  messageText,
  persistConversation,
} from "@/lib/agent/persist-conversation";
import { createAgentTools } from "@/lib/agent/tools";
import { detectEscalationSignal } from "@/lib/demo/escalation-signals";
import type { KnowledgeChunk, KnowledgeSource } from "@/lib/types";

/*
 * DEMO MODE — scripted playback, no OpenAI calls.
 *
 * Mirrors the shape of the real agent stream (tool states, then streamed text)
 * so the UI and dashboard behave exactly as they do with a live model. Order
 * lookups and ticket creation run through the real tool implementations; only
 * the language model and the query embedding are replaced by simple rules.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ORDER_PATTERN = /\bFG-\d{5}\b/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

let cachedIndex: KnowledgeChunk[] | null = null;

async function keywordSearch(query: string, limit = 2) {
  if (!cachedIndex) {
    const raw = await readFile(
      path.join(process.cwd(), "data/generated/kb-index.json"),
      "utf8",
    );
    cachedIndex = JSON.parse(raw) as KnowledgeChunk[];
  }

  const terms = query
    .toLowerCase()
    .split(/[^a-zæøå0-9]+/)
    .filter((term) => term.length > 3);

  const ranked = cachedIndex
    .map((chunk) => {
      const haystack = `${chunk.title} ${chunk.text}`.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0,
      );
      return { chunk, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const unique = new Map<string, KnowledgeSource>();
  for (const { chunk, score } of ranked) {
    if (!unique.has(chunk.articleId)) {
      unique.set(chunk.articleId, {
        articleId: chunk.articleId,
        slug: chunk.slug,
        title: chunk.title,
        category: chunk.category,
        excerpt: chunk.text,
        score,
      });
    }
    if (unique.size >= limit) break;
  }
  return [...unique.values()];
}

async function streamText(writer: UIMessageStreamWriter, text: string) {
  const id = crypto.randomUUID();
  writer.write({ type: "start-step" });
  writer.write({ type: "text-start", id });
  // Word-sized chunks with a little jitter read like a real model stream.
  const tokens = text.match(/\S+\s*|\s+/g) ?? [text];
  for (const token of tokens) {
    writer.write({ type: "text-delta", id, delta: token });
    await sleep(22 + Math.random() * 26);
  }
  writer.write({ type: "text-end", id });
  writer.write({ type: "finish-step" });
}

async function runTool(
  writer: UIMessageStreamWriter,
  toolName: string,
  input: unknown,
  execute: () => unknown,
  minimumMs = 1100,
) {
  const toolCallId = `demo-${crypto.randomUUID()}`;
  writer.write({ type: "start-step" });
  writer.write({ type: "tool-input-start", toolCallId, toolName });
  writer.write({ type: "tool-input-available", toolCallId, toolName, input });
  const [output] = await Promise.all([
    Promise.resolve(execute()),
    sleep(minimumMs),
  ]);
  writer.write({ type: "tool-output-available", toolCallId, output });
  writer.write({ type: "finish-step" });
  await sleep(260);
  return output;
}

export function createDemoResponse(id: string, messages: UIMessage[]) {
  const latestUser = [...messages].reverse().find((m) => m.role === "user");
  const latestText = latestUser ? messageText(latestUser) : "";
  const allUserText = messages
    .filter((m) => m.role === "user")
    .map(messageText)
    .join(" ");
  const { tools, state } = createAgentTools({
    conversationId: id,
    latestMessage: latestText,
  });
  const toolOptions = { toolCallId: "demo", messages: [] };

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      await sleep(550);

      const escalation = detectEscalationSignal(latestText);
      const orderNumber = allUserText.match(ORDER_PATTERN)?.[0]?.toUpperCase();
      const email = allUserText.match(EMAIL_PATTERN)?.[0];
      let reply: string;

      if (escalation.shouldEscalate) {
        // Use verified order context first, as the real agent is instructed to.
        if (orderNumber && email) {
          await runTool(
            writer,
            "lookupOrder",
            { orderNumber, email },
            () => tools.lookupOrder.execute!({ orderNumber, email }, toolOptions),
            900,
          );
        }
        const frustrated = /second time|again|unacceptable|fed up|angry/i.test(
          latestText,
        );
        const wantsRefund = /refund/i.test(latestText);
        const input = {
          category: wantsRefund ? "refund" : orderNumber ? "delivery" : "other",
          priority: frustrated ? "high" : "normal",
          sentiment: frustrated ? "frustrated" : "neutral",
          summary: state.verifiedOrder
            ? `${state.verifiedOrder.customerName} reports order ${state.verifiedOrder.orderNumber} is delayed (${state.verifiedOrder.statusNote.replace(/\.$/, "")}) and is ${wantsRefund ? "requesting a refund" : "asking for help from a person"}.`
            : `Customer asked to speak with a person: “${latestText.slice(0, 180)}”.`,
          ...(email ? { customerEmail: email } : {}),
          ...(orderNumber ? { orderNumber } : {}),
        } as const;
        const ticket = await runTool(writer, "createSupportTicket", input, () =>
          tools.createSupportTicket.execute!(input, toolOptions),
        );
        const ticketId = (ticket as { ticketId: string }).ticketId;
        reply = wantsRefund
          ? `I’m sorry — a second delay is genuinely frustrating. I can’t approve a refund myself, so I’ve passed this to our support team with your order details.\n\nYour ticket is ${ticketId}. A specialist will follow up by email, normally within one business day.`
          : `Of course. I’ve handed this to our support team with a short summary, so you won’t need to repeat yourself.\n\nYour ticket is ${ticketId}. A specialist will reply by email, normally within one business day.`;
      } else if (orderNumber && email) {
        await runTool(writer, "lookupOrder", { orderNumber, email }, () =>
          tools.lookupOrder.execute!({ orderNumber, email }, toolOptions),
        );
        reply = state.verifiedOrder
          ? `Thanks, ${state.verifiedOrder.customerName.split(" ")[0]}. ${state.verifiedOrder.statusNote} You can follow the parcel with the tracking link below.`
          : "I couldn’t find an order matching both of those details. Could you double-check the order number and the email you used at checkout?";
      } else if (orderNumber) {
        reply = `Happy to check ${orderNumber} for you. For your privacy, what’s the email address you used when ordering?`;
      } else {
        const sources = (await runTool(
          writer,
          "searchKnowledgeBase",
          { query: latestText },
          async () => {
            state.toolsUsed.add("searchKnowledgeBase");
            const found = await keywordSearch(latestText);
            state.sources = found;
            return {
              found: found.length > 0,
              sources: found.map(({ score, ...source }) => {
                void score;
                return source;
              }),
            };
          },
        )) as { found: boolean };
        if (/return|jacket|worn|used/i.test(latestText)) {
          reply =
            "A jacket that’s been worn outdoors can’t go back as a normal change-of-mind return — trying it on indoors is fine, though.\n\nIf it seems faulty, like a failed seam or a leaking membrane, it may qualify for a warranty assessment instead. Send us the order number and a few clear photos and we’ll take a look.";
        } else if (sources.found) {
          const top = state.sources[0];
          const sentence = top.excerpt
            .replace(/^#+.*$/gm, "")
            .replace(/\s+/g, " ")
            .trim()
            .split(/(?<=\.)\s/)
            .slice(0, 2)
            .join(" ");
          reply = `Here’s what our ${top.title.toLowerCase()} guide says: ${sentence}`;
        } else {
          reply =
            "I couldn’t find that in Fjellvik’s help centre. I can pass it to our support team if you’d like a person to take a look.";
        }
      }

      await streamText(writer, reply);
      writer.write({ type: "finish" });

      await persistConversation({
        id,
        messages,
        assistantText: reply,
        state,
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
