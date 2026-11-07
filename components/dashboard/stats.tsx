import { Bot, MessageSquare, Ticket } from "lucide-react";
import type { DashboardData } from "@/lib/types";

export function DashboardStats({ stats }: { stats: DashboardData["stats"] }) {
  const cards = [
    {
      label: "Conversations handled",
      value: stats.conversations,
      caption: "Across the local demo workspace",
      icon: MessageSquare,
    },
    {
      label: "Resolved by Relay",
      value: `${stats.resolutionRate}%`,
      caption: `${stats.resolvedByAi} conversations resolved without handoff`,
      icon: Bot,
    },
    {
      label: "Open escalations",
      value: stats.escalations,
      caption: stats.escalations === 1 ? "1 ticket needs attention" : `${stats.escalations} tickets need attention`,
      icon: Ticket,
    },
  ];

  return (
    <section className="stats-grid">
      {cards.map(({ label, value, caption, icon: Icon }) => (
        <article className="stat-card" key={label}>
          <div className="stat-top">
            {label}
            <span className="stat-icon">
              <Icon size={16} />
            </span>
          </div>
          <div className="stat-value">{value}</div>
          <p className="stat-caption">{caption}</p>
        </article>
      ))}
    </section>
  );
}
