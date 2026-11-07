import "server-only";

import path from "node:path";
import type { Ticket } from "@/lib/types";
import { readJson, writeJson } from "./json-store";

const TICKETS_PATH = path.join(process.cwd(), "data/tickets.json");

export async function listTickets() {
  const tickets = await readJson<Ticket[]>(TICKETS_PATH);
  return tickets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createTicket(
  ticket: Omit<Ticket, "id" | "createdAt" | "status">,
) {
  const tickets = await readJson<Ticket[]>(TICKETS_PATH);
  const existing = tickets.find(
    (item) => item.conversationId === ticket.conversationId,
  );

  if (existing) return existing;

  const largestId = tickets.reduce((largest, item) => {
    const value = Number(item.id.replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(largest, value) : largest;
  }, 2400);

  const created: Ticket = {
    ...ticket,
    id: `TKT-${largestId + 1}`,
    createdAt: new Date().toISOString(),
    status: "open",
  };

  await writeJson(TICKETS_PATH, [created, ...tickets]);
  return created;
}
