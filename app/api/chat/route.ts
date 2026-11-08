import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { createAgentTools } from "@/lib/agent/tools";
import { detectEscalationSignal } from "@/lib/demo/escalation-signals";
import { isDemoMode } from "@/lib/demo/demo-mode";
import { createDemoResponse } from "@/lib/demo/demo-playback";
import {
  messageText,
  persistConversation,
} from "@/lib/agent/persist-conversation";

export const maxDuration = 30;

export async function POST(request: Request) {
  const demo = isDemoMode();

  if (!demo && !process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "OPENAI_API_KEY is missing. Add it to .env.local and restart the development server.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    id?: string;
    messages?: UIMessage[];
  };

  if (!body.id || !Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const messages = body.messages;

  // Scripted playback for recordings and keyless local runs. See lib/demo.
  if (demo) return createDemoResponse(body.id, messages);

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const latestText = latestUserMessage ? messageText(latestUserMessage) : "";
  const escalation = detectEscalationSignal(latestText);
  const { tools, state } = createAgentTools({
    conversationId: body.id,
    latestMessage: latestText,
  });

  const result = streamText({
    model: openai(process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini"),
    system: buildSystemPrompt(escalation.directive),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    temperature: 0.2,
    onFinish: async ({ text }) => {
      await persistConversation({
        id: body.id!,
        messages,
        assistantText: text,
        state,
      });
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("Relay stream error:", error);
      return error instanceof Error
        ? error.message
        : "Relay could not complete that request.";
    },
  });
}
