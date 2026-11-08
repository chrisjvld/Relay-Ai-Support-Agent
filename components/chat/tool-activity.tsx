"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Check,
  Clock3,
  ExternalLink,
  Headset,
  Package,
  PackageSearch,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { getToolName } from "ai";
import { riseIn, spring } from "@/lib/motion";
import type { KnowledgeSource, Order } from "@/lib/types";

export type AnyToolPart = Parameters<typeof getToolName>[0];

interface SearchOutput {
  found: boolean;
  sources: Omit<KnowledgeSource, "score">[];
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

type RowState = "working" | "done" | "error";

const STATUS_LABEL: Record<string, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  delayed: "Delayed",
  returned: "Returned",
};

const STATUS_PILL: Record<string, string> = {
  processing: "pill",
  shipped: "pill pill-accent",
  delivered: "pill pill-success",
  delayed: "pill pill-warning",
  returned: "pill",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function rowState(part: AnyToolPart): RowState {
  if (part.state === "output-available") return "done";
  if (part.state === "output-error" || part.state === "output-denied") {
    return "error";
  }
  return "working";
}

/** One live status row: icon with spinner ring → check, shimmering label. */
function ActivityRow({
  icon: Icon,
  state,
  label,
  detail,
  children,
}: {
  icon: typeof Search;
  state: RowState;
  label: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  const started = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState<string | null>(null);
  const wasWorking = useRef(state === "working");

  useEffect(() => {
    if (state === "working") {
      started.current ??= performance.now();
      return;
    }
    // Only time rows we actually watched run, not restored history.
    if (wasWorking.current && started.current !== null) {
      const seconds = (performance.now() - started.current) / 1000;
      wasWorking.current = false;
      const id = requestAnimationFrame(() =>
        setElapsed(`${seconds.toFixed(1)}s`),
      );
      return () => cancelAnimationFrame(id);
    }
  }, [state]);

  const working = state === "working";

  return (
    <motion.div className="activity-item" layout="position" transition={spring}>
      <div className="activity-row">
        <span className="activity-icon" data-state={state}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              initial={{ opacity: 0, scale: 0.5 }}
              key={state}
              style={{ display: "grid" }}
              transition={spring}
            >
              {state === "done" ? (
                <Check size={13} strokeWidth={2.75} />
              ) : state === "error" ? (
                <X size={13} strokeWidth={2.75} />
              ) : (
                <Icon size={12} strokeWidth={2} />
              )}
            </motion.span>
          </AnimatePresence>
          {working && <span aria-hidden="true" className="spinner" />}
        </span>
        <span className="activity-label" data-working={working}>
          <span>{label}</span>
          {detail && <small>{detail}</small>}
        </span>
        <span className="activity-meta">{elapsed}</span>
      </div>
      {children}
    </motion.div>
  );
}

export function ToolRow({ part }: { part: AnyToolPart }) {
  const name = getToolName(part);
  const state = rowState(part);
  const output = state === "done" ? part.output : undefined;

  if (name === "searchKnowledgeBase") {
    const input = part.input as { query?: string } | undefined;
    const result = output as SearchOutput | undefined;
    const count = result?.sources.length ?? 0;

    return (
      <ActivityRow
        detail={
          state === "working"
            ? input?.query
              ? `“${input.query}”`
              : "Reading approved articles"
            : state === "error"
              ? "The help centre could not be reached"
              : count > 0
                ? `${count} approved ${count === 1 ? "article" : "articles"} matched`
                : "No matching articles"
        }
        icon={Search}
        label={
          state === "working"
            ? "Searching the help centre"
            : state === "error"
              ? "Help centre search failed"
              : "Searched the help centre"
        }
        state={state}
      >
        {result?.found && (
          <div className="source-chips">
            {result.sources.map((source, index) => (
              <motion.span
                className="source-chip"
                key={source.articleId}
                {...riseIn(index, 0.06)}
              >
                <BookOpen size={12} strokeWidth={2} />
                {source.title}
              </motion.span>
            ))}
          </div>
        )}
      </ActivityRow>
    );
  }

  if (name === "lookupOrder") {
    const input = part.input as { orderNumber?: string } | undefined;
    const result = output as OrderOutput | undefined;
    const orderNumber = input?.orderNumber?.toUpperCase() ?? "order";
    const notFound = state === "done" && !result?.found;

    return (
      <ActivityRow
        detail={
          state === "working"
            ? "Matching order number and email"
            : state === "error"
              ? "Order system unavailable"
              : notFound
                ? "Details didn’t match an order"
                : `${STATUS_LABEL[result?.order?.status ?? ""] ?? "Found"} · ${result?.order?.items.length ?? 0} items`
        }
        icon={PackageSearch}
        label={
          state === "working"
            ? `Verifying ${orderNumber}`
            : notFound || state === "error"
              ? `Couldn’t verify ${orderNumber}`
              : `Verified ${orderNumber}`
        }
        state={notFound ? "error" : state}
      />
    );
  }

  if (name === "createSupportTicket") {
    const input = part.input as
      | { priority?: string; category?: string }
      | undefined;
    const result = output as TicketOutput | undefined;

    return (
      <ActivityRow
        detail={
          state === "working"
            ? "Writing a summary for a specialist"
            : state === "error"
              ? "Please try again"
              : `Priority ${result?.priority ?? input?.priority ?? "normal"} · ${input?.category ?? "support"}`
        }
        icon={Ticket}
        label={
          state === "working"
            ? "Handing off to the support team"
            : state === "error"
              ? "Handoff failed"
              : `Created ticket ${result?.ticketId ?? ""}`
        }
        state={state}
      />
    );
  }

  return null;
}

/** Rich result shown after a tool finishes (order details, human handoff). */
export function ToolResult({ part }: { part: AnyToolPart }) {
  if (part.state !== "output-available") return null;
  const name = getToolName(part);

  if (name === "lookupOrder") {
    const result = part.output as OrderOutput;
    if (!result.found || !result.order) return null;
    const order = result.order;

    return (
      <motion.div className="result-card" {...riseIn()}>
        <div className="result-head">
          <span className="result-head-icon">
            <Package size={18} strokeWidth={1.75} />
          </span>
          <span className="result-head-copy">
            <small>Order {order.orderNumber}</small>
            <strong>{order.customerName}</strong>
          </span>
          <span className={STATUS_PILL[order.status] ?? "pill"}>
            <span className="dot" />
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
        <p className="result-note">{order.statusNote}</p>
        <ul className="order-items">
          {order.items.map((item) => (
            <li key={`${item.name}-${item.variant}`}>
              <span>{item.name}</span>
              <span>
                {item.variant} · ×{item.quantity}
              </span>
            </li>
          ))}
        </ul>
        {(order.estimatedDelivery || order.trackingUrl) && (
          <div className="result-footer">
            {order.estimatedDelivery && (
              <span>
                <Clock3 size={13} />
                Arrives {formatDate(order.estimatedDelivery)}
              </span>
            )}
            {order.trackingUrl && (
              <a href={order.trackingUrl} rel="noreferrer" target="_blank">
                Track parcel <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  if (name === "createSupportTicket") {
    const result = part.output as TicketOutput;
    if (!result.created) return null;

    return (
      <motion.div className="handoff-card" {...riseIn()}>
        <div className="handoff-top">
          <span className="handoff-avatar">
            <Headset size={19} strokeWidth={1.75} />
          </span>
          <span>
            <strong>Handed off to a person</strong>
            <small>A specialist has your conversation and order details.</small>
          </span>
        </div>
        <dl className="handoff-grid">
          <div>
            <dt>Ticket</dt>
            <dd>{result.ticketId}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{result.priority}</dd>
          </div>
          <div>
            <dt>Reply target</dt>
            <dd>1 business day</dd>
          </div>
        </dl>
      </motion.div>
    );
  }

  return null;
}
