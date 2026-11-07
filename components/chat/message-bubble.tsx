import { isToolUIPart, type UIMessage } from "ai";
import { ToolActivity } from "./tool-activity";

export function MessageBubble({ message }: { message: UIMessage }) {
  return (
    <div className={`message ${message.role}`}>
      {message.parts.map((part, index) => {
        if (part.type === "text" && part.text) {
          return (
            <div className="bubble" key={`${message.id}-text-${index}`}>
              {part.text}
            </div>
          );
        }

        if (isToolUIPart(part)) {
          return (
            <ToolActivity
              key={`${message.id}-tool-${index}`}
              part={part}
            />
          );
        }

        return null;
      })}
      <div className="message-time">
        {message.role === "assistant" ? "Relay" : "You"} · now
      </div>
    </div>
  );
}
