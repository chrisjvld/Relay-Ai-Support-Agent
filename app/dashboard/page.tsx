import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RelayMark } from "@/components/brand/relay-mark";
import { ScrollHeader } from "@/components/chrome/scroll-header";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <>
      <ScrollHeader className="dash-nav">
        <nav aria-label="Dashboard" className="nav-inner">
          <Link className="dash-brand" href="/dashboard">
            <RelayMark size={28} />
            <span>Relay</span>
            <span>Fjellvik Support</span>
          </Link>
          <div className="dash-nav-actions">
            <span className="live-indicator">
              <span className="dot" />
              <span>Live</span>
            </span>
            <Link className="nav-cta pressable" href="/">
              Customer chat
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </nav>
      </ScrollHeader>

      <main className="dash-main">
        <div className="dash-title">
          <p>Support overview</p>
          <h1>Good morning, Ingrid.</h1>
        </div>
        <DashboardClient />
      </main>
    </>
  );
}
