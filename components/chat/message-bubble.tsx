"use client";

import { Fragment } from "react";
import { isToolUIPart, type UIMessage } from "ai";
import { motion } from "motion/react";
import { spring } from "@/lib/motion";
import { ToolResult, ToolRow, type AnyToolPart } from "./tool-activity";
import { useSmoothText } from "./use-smooth-text";

type Segment =
  | { kind: "text"; key: string; text: string }
  | { kind: "tools"; key: string; parts: AnyToolPart[] };

/** Groups consecutive tool calls into one activity block between text runs. */
function toSegments(message: UIMessage): Segment[] {
  const segments: Segment[] = [];

  message.parts.forEach((part, index) => {
    if (part.type === "text" && part.text) {
      segments.push({ kind: "text", key: `t${index}`, text: part.text });
      return;
    }
    if (isToolUIPart(part)) {
      const last = segments[segments.length - 1];
      if (last?.kind === "tools") last.parts.push(part);
      else segments.push({ kind: "tools", key: `g${index}`, parts: [part] });
    }
  });

  return segments;
}

function StreamingText({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  const shown = useSmoothText(text, streaming);
  return <div className="bubble">{shown}</div>;
}

export function MessageBubble({
  message,
  streaming,
  hiddenResults,
}: {
  message: UIMessage;
  streaming: boolean;
  /** Tool calls whose rich card already appeared earlier in the thread. */
  hiddenResults?: Set<string>;
}) {
  const segments = toSegments(message);
  if (segments.length === 0) return null;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`msg msg-${message.role}`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      style={{
        transformOrigin: message.role === "user" ? "100% 100%" : "0% 100%",
      }}
      transition={spring}
    >
      {segments.map((segment) =>
        segment.kind === "text" ? (
          <StreamingText
            key={segment.key}
            streaming={streaming}
            text={segment.text}
          />
        ) : (
          <Fragment key={segment.key}>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              aria-live="polite"
              className="activity"
              initial={{ opacity: 0, y: 6 }}
              layout
              role="status"
              transition={spring}
            >
              {segment.parts.map((part) => (
                <ToolRow key={part.toolCallId} part={part} />
              ))}
            </motion.div>
            {segment.parts
              .filter((part) => !hiddenResults?.has(part.toolCallId))
              .map((part) => (
                <ToolResult key={`${part.toolCallId}-result`} part={part} />
              ))}
          </Fragment>
        ),
      )}
    </motion.div>
  );
}
