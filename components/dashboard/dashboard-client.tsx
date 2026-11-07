"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { ConversationList } from "./conversation-list";
import { DashboardStats } from "./stats";
import { TicketList } from "./ticket-list";

const EMPTY_DATA: DashboardData = {
  stats: {
    conversations: 0,
    resolvedByAi: 0,
    resolutionRate: 0,
    escalations: 0,
  },
  tickets: [],
  conversations: [],
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) return;
        const nextData = (await response.json()) as DashboardData;
        if (active) {
          setData(nextData);
          setLoaded(true);
        }
      } catch {
        // Keep the last successful snapshot during a transient local dev error.
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 3_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!loaded) {
    return (
      <div className="dashboard-loading">
        <span />
        Loading support workspace…
      </div>
    );
  }

  return (
    <>
      <DashboardStats stats={data.stats} />
      <section className="dashboard-grid">
        <ConversationList conversations={data.conversations} />
        <TicketList tickets={data.tickets} />
      </section>
    </>
  );
}
