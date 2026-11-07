import { Clock3, MessageCircleMore } from "lucide-react";
import type { Ticket } from "@/lib/types";

function relativeTime(value: string) {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function TicketList({ tickets }: { tickets: Ticket[] }) {
  return (
    <article className="dashboard-card">
      <header className="card-header">
        <h2>Escalated tickets</h2>
        <span>Needs attention</span>
      </header>
      {tickets.length === 0 ? (
        <div className="empty-state">Relay has not escalated any tickets.</div>
      ) : (
        <div className="ticket-list">
          {tickets.map((ticket, index) => (
            <div
              className={`ticket-row ${index === 0 ? "newest" : ""}`}
              key={ticket.id}
            >
              <div className="ticket-row-top">
                <span className="ticket-id">{ticket.id}</span>
                <span className={`priority priority-${ticket.priority}`}>
                  {ticket.priority}
                </span>
                <span className={`sentiment sentiment-${ticket.sentiment}`}>
                  {ticket.sentiment}
                </span>
                <time>
                  <Clock3 size={10} />
                  {relativeTime(ticket.createdAt)}
                </time>
              </div>
              <p>{ticket.summary}</p>
              <div className="ticket-row-bottom">
                <span>
                  <MessageCircleMore size={11} />
                  {ticket.category}
                </span>
                {ticket.orderNumber && <strong>{ticket.orderNumber}</strong>}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
