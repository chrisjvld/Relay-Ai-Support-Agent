import Link from "next/link";
import {
  Backpack,
  Footprints,
  MountainSnow,
  Shirt,
  Tent,
  Truck,
} from "lucide-react";
import { ScrollHeader } from "@/components/chrome/scroll-header";

const products = [
  {
    icon: Shirt,
    tag: "New",
    name: "Nordmarka Shell",
    detail: "3-layer waterproof jacket",
    price: "3 499 kr",
  },
  {
    icon: Backpack,
    tag: "",
    name: "Jotun 38L Pack",
    detail: "Alpine day pack",
    price: "2 199 kr",
  },
  {
    icon: Footprints,
    tag: "",
    name: "Merino Trail Socks",
    detail: "Two-pack, cushioned",
    price: "349 kr",
  },
  {
    icon: Tent,
    tag: "Back in stock",
    name: "Hardanger 2P",
    detail: "Four-season tent",
    price: "6 990 kr",
  },
];

function Ridgeline() {
  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
      viewBox="0 0 1600 700"
    >
      <circle cx="1170" cy="210" fill="var(--sun)" opacity="0.9" r="64" />
      <path
        d="M0 420 L160 330 L300 380 L470 250 L620 340 L760 280 L930 360 L1080 260 L1240 330 L1400 270 L1600 340 V700 H0Z"
        fill="var(--ridge-1)"
      />
      <path
        d="M0 470 L130 420 L260 450 L420 360 L560 430 L700 390 L860 455 L1010 380 L1170 440 L1330 400 L1480 450 L1600 420 V700 H0Z"
        fill="var(--ridge-2)"
      />
      <path
        d="M0 540 L180 470 L340 520 L520 450 L690 520 L860 480 L1040 540 L1210 470 L1390 530 L1600 480 V700 H0Z"
        fill="var(--ridge-3)"
      />
      <path
        d="M0 610 L220 540 L430 600 L640 545 L860 610 L1080 560 L1300 615 L1600 560 V700 H0Z"
        fill="var(--ridge-4)"
      />
      <path
        d="M0 700 L0 660 L300 620 L620 670 L940 630 L1260 675 L1600 640 V700Z"
        fill="var(--ridge-5)"
      />
    </svg>
  );
}

export function StorefrontHero() {
  return (
    <>
      <ScrollHeader className="store-nav">
        <nav aria-label="Main" className="nav-inner">
          <Link className="store-wordmark" href="/">
            <MountainSnow size={20} strokeWidth={1.75} />
            Fjellvik
          </Link>
          <div className="nav-links">
            <a className="nav-secondary" href="#shop">
              Shop
            </a>
            <a className="nav-secondary" href="#shop">
              New arrivals
            </a>
            <Link className="nav-cta pressable" href="/dashboard">
              Support dashboard
            </Link>
          </div>
        </nav>
      </ScrollHeader>

      <main>
        <section className="hero">
          <p className="hero-eyebrow">Autumn / Winter 2026</p>
          <h1 className="hero-title">
            Made for the north. <span>Built to last.</span>
          </h1>
          <p className="hero-lede">
            Field-tested layers and dependable equipment for long days above
            the tree line. Designed in Bergen.
          </p>
          <div className="hero-actions">
            <a className="button button-primary pressable" href="#shop">
              Shop the collection
            </a>
            <a className="button button-plain" href="#shop">
              Five-year warranty ›
            </a>
          </div>

          <div className="hero-banner">
            <Ridgeline />
            <div className="banner-chip">
              <span className="banner-chip-swatch">
                <Truck size={20} strokeWidth={1.75} />
              </span>
              <span>
                <strong>Free delivery over 1 200 kr</strong>
                <small>Shipped from Bergen in 1–2 days</small>
              </span>
            </div>
          </div>
        </section>

        <section className="section" id="shop">
          <div className="section-header">
            <h2>
              The essentials. <span>Ready for weather.</span>
            </h2>
          </div>
          <div className="product-grid">
            {products.map(({ icon: Icon, tag, name, detail, price }) => (
              <article className="product-card" key={name}>
                <div className="product-art">
                  <Icon size={44} strokeWidth={1.25} />
                </div>
                <small>{tag || " "}</small>
                <h3>{name}</h3>
                <p>{detail}</p>
                <div className="price">{price}</div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="store-footer">
        Fjellvik Gear is a fictional store used to demo Relay, an AI support
        agent.
      </footer>
    </>
  );
}
