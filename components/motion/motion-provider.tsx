"use client";

import { MotionConfig } from "motion/react";

/**
 * reducedMotion="user" makes every motion component honour
 * prefers-reduced-motion: transforms are skipped, opacity still cross-fades.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
