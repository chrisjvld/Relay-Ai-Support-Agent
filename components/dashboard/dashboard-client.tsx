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
      <div aria-busy="true" aria-label="Loading support workspace">
        <div className="stats-grid">
          {[0, 1, 2].map((key) => (
            <div className="card stat-card" key={key}>
              <div className="skeleton" style={{ width: "45%", height: 14 }} />
              <div
                className="skeleton"
                style={{ width: "30%", height: 36, marginTop: 14 }}
              />
              <div
                className="skeleton"
                style={{ width: "70%", height: 12, marginTop: 12 }}
              />
            </div>
          ))}
        </div>
        <div className="dash-grid">
          {[0, 1].map((key) => (
            <div className="card" key={key} style={{ padding: 22 }}>
              <div className="skeleton" style={{ width: "40%", height: 16 }} />
              {[0, 1, 2, 3].map((row) => (
                <div
                  className="skeleton"
                  key={row}
                  style={{ height: 44, marginTop: 14 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardStats stats={data.stats} />
      <section className="dash-grid">
        <ConversationList conversations={data.conversations} />
        <TicketList tickets={data.tickets} />
      </section>
    </>
  );
}
