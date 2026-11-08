"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Tag } from "lucide-react";
import { riseIn } from "@/lib/motion";
import type { Ticket } from "@/lib/types";

function relativeTime(value: string, now: number) {
  const minutes = Math.max(
    1,
    Math.round((now - new Date(value).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const PRIORITY_PILL: Record<string, string> = {
  low: "pill",
  normal: "pill",
  high: "pill pill-warning",
  urgent: "pill pill-danger",
};

const SENTIMENT_PILL: Record<string, string> = {
  positive: "pill pill-success",
  neutral: "pill",
  frustrated: "pill pill-warning",
  angry: "pill pill-danger",
};

export function TicketList({ tickets }: { tickets: Ticket[] }) {
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Highlight tickets that arrive while the dashboard is open.
  useEffect(() => {
    const ids = tickets.map((ticket) => ticket.id);
    if (seen.current === null) {
      seen.current = new Set(ids);
      return;
    }
    const arrived = ids.filter((id) => !seen.current!.has(id));
    if (arrived.length === 0) return;
    arrived.forEach((id) => seen.current!.add(id));
    const frame = requestAnimationFrame(() =>
      setFresh((previous) => new Set([...previous, ...arrived])),
    );
    const timeout = window.setTimeout(
      () =>
        setFresh((previous) => {
          const next = new Set(previous);
          arrived.forEach((id) => next.delete(id));
          return next;
        }),
      8_000,
    );
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [tickets]);

  return (
    <article className="card">
      <header className="card-header">
        <h2>Escalated tickets</h2>
        <span>{tickets.length} open</span>
      </header>
      {tickets.length === 0 ? (
        <div className="empty-state">
          <p>Relay hasn’t needed to hand anything off.</p>
        </div>
      ) : (
        <ul className="list tickets">
          <AnimatePresence initial={true}>
            {tickets.map((ticket, index) => (
              <motion.li
                className="ticket-row"
                data-new={fresh.has(ticket.id)}
                key={ticket.id}
                layout="position"
                {...riseIn(index + 2)}
              >
                <div className="ticket-top">
                  <span className="ticket-id">{ticket.id}</span>
                  <span className={PRIORITY_PILL[ticket.priority] ?? "pill"}>
                    {ticket.priority[0].toUpperCase() + ticket.priority.slice(1)}
                  </span>
                  <span className={SENTIMENT_PILL[ticket.sentiment] ?? "pill"}>
                    {ticket.sentiment[0].toUpperCase() + ticket.sentiment.slice(1)}
                  </span>
                  <time dateTime={ticket.createdAt} suppressHydrationWarning>
                    {relativeTime(ticket.createdAt, now)}
                  </time>
                </div>
                <p>{ticket.summary}</p>
                <div className="ticket-bottom">
                  <span>
                    <Tag size={13} />
                    {ticket.category}
                  </span>
                  {ticket.orderNumber && <code>{ticket.orderNumber}</code>}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </article>
  );
}
