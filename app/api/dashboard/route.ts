import { listConversations } from "@/lib/repositories/conversations";
import { listTickets } from "@/lib/repositories/tickets";
import type { DashboardData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const [conversations, tickets] = await Promise.all([
    listConversations(),
    listTickets(),
  ]);
  const resolvedByAi = conversations.filter(
    (conversation) => conversation.status === "resolved_by_ai",
  ).length;
  const openTickets = tickets.filter((ticket) => ticket.status !== "resolved");

  const data: DashboardData = {
    stats: {
      conversations: conversations.length,
      resolvedByAi,
      resolutionRate:
        conversations.length === 0
          ? 0
          : Math.round((resolvedByAi / conversations.length) * 100),
      escalations: openTickets.length,
    },
    tickets: openTickets.slice(0, 8),
    conversations: conversations.slice(0, 10),
  };

  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
