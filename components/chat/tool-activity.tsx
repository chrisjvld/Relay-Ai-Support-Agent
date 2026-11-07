import {
  BookOpen,
  Check,
  Clock3,
  ExternalLink,
  PackageCheck,
  Route,
  Search,
  TicketCheck,
} from "lucide-react";
import { getToolName } from "ai";
import type { KnowledgeSource, Order } from "@/lib/types";

type AnyToolPart = Parameters<typeof getToolName>[0];

interface SearchOutput {
  found: boolean;
  sources: KnowledgeSource[];
}

interface OrderOutput {
  found: boolean;
  order?: Omit<Order, "email">;
  message?: string;
}

interface TicketOutput {
  created: boolean;
  ticketId: string;
  priority: string;
  responseTarget: string;
}

function ActivityLine({
  icon: Icon,
  children,
  complete,
}: {
  icon: typeof Search;
  children: React.ReactNode;
  complete: boolean;
}) {
  return (
    <div className={`tool-line ${complete ? "complete" : "working"}`}>
      <span className="tool-line-icon">
        {complete ? <Check size={12} /> : <Icon size={13} />}
      </span>
      <span>{children}</span>
      {!complete && <i />}
    </div>
  );
}

export function ToolActivity({ part }: { part: AnyToolPart }) {
  const name = getToolName(part);
  const complete = part.state === "output-available";
  const output = complete ? part.output : undefined;

  if (name === "searchKnowledgeBase") {
    const result = output as SearchOutput | undefined;

    return (
      <div className="tool-block">
        <ActivityLine complete={complete} icon={Search}>
          {complete ? "Searched Fjellvik help centre" : "Searching help centre…"}
        </ActivityLine>
        {result?.found && (
          <div className="source-list">
            {result.sources.map((source) => (
              <div className="source-card" key={source.articleId}>
                <span className="source-icon">
                  <BookOpen size={14} />
                </span>
                <span>
                  <small>Source · {source.category}</small>
                  <strong>{source.title}</strong>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (name === "lookupOrder") {
    const result = output as OrderOutput | undefined;
    const input = part.input as { orderNumber?: string } | undefined;

    return (
      <div className="tool-block">
        <ActivityLine complete={complete} icon={Route}>
          {complete
            ? `Checked order ${input?.orderNumber ?? ""}`
            : `Checking order ${input?.orderNumber ?? ""}…`}
        </ActivityLine>
        {result?.found && result.order && (
          <div className="order-card">
            <div className="order-card-top">
              <span className={`status-dot ${result.order.status}`} />
              <span>
                <small>{result.order.orderNumber}</small>
                <strong>{result.order.status.replace("_", " ")}</strong>
              </span>
              <PackageCheck size={18} />
            </div>
            <p>{result.order.statusNote}</p>
            <div className="order-meta">
              {result.order.estimatedDelivery && (
                <span>
                  <Clock3 size={12} />
                  Est. {result.order.estimatedDelivery}
                </span>
              )}
              {result.order.trackingUrl && (
                <a
                  href={result.order.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Track parcel <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (name === "createSupportTicket") {
    const result = output as TicketOutput | undefined;

    return (
      <div className="tool-block">
        <ActivityLine complete={complete} icon={TicketCheck}>
          {complete
            ? `Created ticket ${result?.ticketId ?? ""}`
            : "Creating support ticket…"}
        </ActivityLine>
        {result?.created && (
          <div className="ticket-confirmation">
            <TicketCheck size={16} />
            <span>
              <small>Human handoff</small>
              <strong>{result.ticketId}</strong>
            </span>
            <em>{result.priority}</em>
          </div>
        )}
      </div>
    );
  }

  return null;
}
