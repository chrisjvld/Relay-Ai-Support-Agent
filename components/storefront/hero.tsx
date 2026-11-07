import Link from "next/link";
import { MountainSnow, ShieldCheck } from "lucide-react";

export function StorefrontHero() {
  return (
    <main className="app-shell noise">
      <nav className="site-nav">
        <Link className="wordmark" href="/">
          <span className="brand-mark">
            <MountainSnow size={19} strokeWidth={1.8} />
          </span>
          Fjellvik Gear
        </Link>
        <div className="nav-links">
          <a href="#new">New arrivals</a>
          <a href="#equipment">Equipment</a>
          <Link className="nav-pill" href="/dashboard">
            Support dashboard
          </Link>
        </div>
      </nav>

      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Built for Nordic weather</span>
          <h1 className="hero-title serif">
            Go further.
            <br />
            <em>Stay wild.</em>
          </h1>
          <p className="hero-lede">
            Field-tested layers and dependable equipment for long days above
            the tree line. Designed in Bergen, made to keep moving.
          </p>
          <div className="feature-row">
            <span className="feature-chip">
              <span className="feature-dot" />
              Free delivery over 1,200 NOK
            </span>
            <span className="feature-chip">
              <ShieldCheck size={13} />
              5-year product warranty
            </span>
          </div>
        </div>

        <div className="landscape-card" aria-label="Mountain landscape">
          <div className="landscape-label">
            <small>Autumn / Winter 2026</small>
            <strong className="serif">Made for the north.</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
