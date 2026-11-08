import type { Transition } from "motion/react";

/** Critically damped house spring — the default for every UI transition. */
export const spring: Transition = { type: "spring", bounce: 0, duration: 0.35 };

/** Slightly slower spring for large surfaces such as the chat sheet. */
export const sheetSpring: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.4,
};

/** Press feedback, applied on pointer-down. */
export const press = { scale: 0.97, transition: { duration: 0.1 } } as const;

/** Short list stagger: opacity + 8px rise. */
export function riseIn(index = 0, step = 0.04) {
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...spring, delay: Math.min(index, 10) * step },
  } as const;
}
