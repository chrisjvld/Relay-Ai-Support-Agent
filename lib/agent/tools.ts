import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { retrieveKnowledge } from "@/lib/rag/retrieve";
import { findOrder } from "@/lib/repositories/orders";
import { createTicket } from "@/lib/repositories/tickets";
import type {
  KnowledgeSource,
  Order,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketSentiment,
} from "@/lib/types";

export interface AgentRunState {
  sources: KnowledgeSource[];
  toolsUsed: Set<string>;
  verifiedOrder: Order | null;
  ticket: Ticket | null;
}

interface AgentToolContext {
  conversationId: string;
  latestMessage: string;
}

export function createAgentTools(context: AgentToolContext) {
  const state: AgentRunState = {
    sources: [],
    toolsUsed: new Set(),
    verifiedOrder: null,
    ticket: null,
  };

  const tools = {
    searchKnowledgeBase: tool({
      description:
        "Search Fjellvik Gear's approved help centre. Must be used before answering policy, product, care, sizing, payment, shipping, returns, or warranty questions.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("A focused semantic search query based on the customer's question."),
      }),
      execute: async ({ query }) => {
        state.toolsUsed.add("searchKnowledgeBase");
        const sources = await retrieveKnowledge(query);
        state.sources = sources;

        return {
          found: sources.length > 0,
          sources: sources.map(({ score, ...source }) => source),
          instruction:
            sources.length > 0
              ? "Answer using only these excerpts."
              : "Say the answer is not available in Fjellvik's support articles. Do not guess.",
        };
      },
    }),

    lookupOrder: tool({
      description:
        "Look up a Fjellvik order only after the customer supplies both the order number and matching email address.",
      inputSchema: z.object({
        orderNumber: z
          .string()
          .regex(/^FG-\d{5}$/i)
          .describe("Order number in FG-12345 format."),
        email: z.string().email().describe("Customer email used for the order."),
      }),
      execute: async ({ orderNumber, email }) => {
        state.toolsUsed.add("lookupOrder");
        const order = await findOrder(orderNumber, email);

        if (!order) {
          return {
            found: false,
            message:
              "No order matched both details. Ask the customer to check the order number and email without revealing which detail was incorrect.",
          };
        }

        state.verifiedOrder = order;
        const { email: _privateEmail, ...safeOrder } = order;
        void _privateEmail;

        return {
          found: true,
          order: safeOrder,
        };
      },
    }),

    createSupportTicket: tool({
      description:
        "Escalate to Fjellvik's human support team. Use for human requests, strong frustration, safety issues, policy exceptions, refunds, cancellations, and actions Relay cannot perform.",
      inputSchema: z.object({
        category: z.enum([
          "delivery",
          "refund",
          "return",
          "warranty",
          "product",
          "other",
        ]),
        priority: z.enum(["low", "normal", "high", "urgent"]),
        sentiment: z.enum(["positive", "neutral", "frustrated", "angry"]),
        summary: z
          .string()
          .min(20)
          .max(400)
          .describe("A factual 1–2 sentence summary for the human agent."),
        customerEmail: z.string().email().optional(),
        orderNumber: z.string().regex(/^FG-\d{5}$/i).optional(),
      }),
      execute: async ({
        category,
        priority,
        sentiment,
        summary,
        customerEmail,
        orderNumber,
      }) => {
        state.toolsUsed.add("createSupportTicket");

        const ticket = await createTicket({
          conversationId: context.conversationId,
          category: category as TicketCategory,
          priority: priority as TicketPriority,
          sentiment: sentiment as TicketSentiment,
          summary,
          latestMessage: context.latestMessage,
          customerEmail: state.verifiedOrder?.email ?? customerEmail,
          orderNumber: state.verifiedOrder?.orderNumber ?? orderNumber,
        });

        state.ticket = ticket;
        return {
          created: true,
          ticketId: ticket.id,
          priority: ticket.priority,
          responseTarget: "within one business day",
        };
      },
    }),
  };

  return { tools, state };
}
