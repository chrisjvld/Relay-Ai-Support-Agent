import Link from "next/link";
import { MountainSnow } from "lucide-react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <div className="dashboard-shell">
      <nav className="dashboard-nav">
        <Link className="wordmark" href="/">
          <span className="brand-mark">
            <MountainSnow size={19} strokeWidth={1.8} />
          </span>
          Relay
        </Link>
        <Link href="/">Open customer chat →</Link>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-titlebar">
          <div>
            <span className="eyebrow">Fjellvik support operations</span>
            <h1>Good morning, Ingrid.</h1>
          </div>
          <span className="live-pill">
            <i />
            Live updates
          </span>
        </div>

        <DashboardClient />
      </main>
    </div>
  );
}
