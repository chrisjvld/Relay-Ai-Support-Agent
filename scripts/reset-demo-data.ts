import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import type { Conversation, Ticket } from "../lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(name: string) {
  return JSON.parse(await readFile(path.join(DATA_DIR, name), "utf8")) as T;
}

async function main() {
  const [conversations, tickets] = await Promise.all([
    readJson<Conversation[]>("conversations.json"),
    readJson<Ticket[]>("tickets.json"),
  ]);

  const demoConversations = conversations.filter((conversation) =>
    conversation.id.startsWith("conv-demo-"),
  );
  const demoTickets = tickets.filter(
    (ticket) => ticket.conversationId === "conv-demo-003",
  );

  await Promise.all([
    writeFile(
      path.join(DATA_DIR, "conversations.json"),
      `${JSON.stringify(demoConversations, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(DATA_DIR, "tickets.json"),
      `${JSON.stringify(demoTickets, null, 2)}\n`,
      "utf8",
    ),
  ]);

  console.log(
    `Reset complete: ${demoConversations.length} sample conversations and ${demoTickets.length} sample ticket.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
