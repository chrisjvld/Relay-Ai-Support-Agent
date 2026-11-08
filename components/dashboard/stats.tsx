"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { Bot, MessageSquare, Ticket } from "lucide-react";
import { riseIn, spring } from "@/lib/motion";
import type { DashboardData } from "@/lib/types";

/** Counts to the new value with the house spring when the data changes. */
function AnimatedNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { ...spring, duration: 0.6 });
    return () => controls.stop();
  }, [motionValue, reduceMotion, value]);

  return <motion.span>{rounded}</motion.span>;
}

export function DashboardStats({ stats }: { stats: DashboardData["stats"] }) {
  const cards = [
    {
      label: "Conversations",
      value: stats.conversations,
      suffix: "",
      caption: "Handled in this workspace",
      icon: MessageSquare,
    },
    {
      label: "Resolved by Relay",
      value: stats.resolutionRate,
      suffix: "%",
      caption: `${stats.resolvedByAi} of ${stats.conversations} without a handoff`,
      icon: Bot,
      meter: stats.resolutionRate / 100,
    },
    {
      label: "Open escalations",
      value: stats.escalations,
      suffix: "",
      caption:
        stats.escalations === 0
          ? "Nothing waiting on the team"
          : stats.escalations === 1
            ? "1 ticket needs a person"
            : `${stats.escalations} tickets need a person`,
      icon: Ticket,
    },
  ];

  return (
    <section aria-label="Key numbers" className="stats-grid">
      {cards.map(({ label, value, suffix, caption, icon: Icon, meter }, index) => (
        <motion.article className="card stat-card" key={label} {...riseIn(index, 0.05)}>
          <div className="stat-label">
            <Icon size={15} />
            {label}
          </div>
          <div className="stat-value">
            <AnimatedNumber value={value} />
            {suffix && <small>{suffix}</small>}
          </div>
          <p className="stat-caption">{caption}</p>
          {meter !== undefined && (
            <div aria-hidden="true" className="stat-meter">
              <motion.div
                animate={{ scaleX: meter }}
                initial={{ scaleX: 0 }}
                transition={{ ...spring, duration: 0.8, delay: 0.15 }}
              />
            </div>
          )}
        </motion.article>
      ))}
    </section>
  );
}
