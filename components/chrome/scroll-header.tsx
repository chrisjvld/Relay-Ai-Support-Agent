"use client";

import { useEffect, useState } from "react";

/**
 * Sticky translucent header. Shows a soft scroll-edge fade only once content
 * actually scrolls beneath it, instead of a permanent hard divider.
 */
export function ScrollHeader({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={className} data-scrolled={scrolled}>
      {children}
    </header>
  );
}
