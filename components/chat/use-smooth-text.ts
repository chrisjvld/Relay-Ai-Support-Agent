"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Model tokens arrive in uneven bursts. This reveals streamed text at display
 * rate, catching up proportionally to how far behind it is, so the reply
 * reads as one continuous motion instead of stuttering chunks.
 *
 * Text that was already complete when it mounted is shown immediately.
 */
export function useSmoothText(text: string, streaming: boolean) {
  const reduceMotion = useReducedMotion();
  const [animated] = useState(streaming);
  const [count, setCount] = useState(animated ? 0 : text.length);
  const countRef = useRef(count);

  useEffect(() => {
    if (!animated || reduceMotion) return;
    let frame = 0;

    const tick = () => {
      const remaining = text.length - countRef.current;
      if (remaining <= 0) return;
      countRef.current += Math.max(1, Math.ceil(remaining / 12));
      setCount(countRef.current);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated, reduceMotion, text]);

  if (!animated || reduceMotion) return text;
  return text.slice(0, count);
}
