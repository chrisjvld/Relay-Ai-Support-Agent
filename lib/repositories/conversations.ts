import "server-only";

import path from "node:path";
import type { Conversation } from "@/lib/types";
import { readJson, writeJson } from "./json-store";

const CONVERSATIONS_PATH = path.join(
  process.cwd(),
  "data/conversations.json",
);

export async function listConversations() {
  const conversations = await readJson<Conversation[]>(CONVERSATIONS_PATH);
  return conversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function upsertConversation(conversation: Conversation) {
  const conversations = await readJson<Conversation[]>(CONVERSATIONS_PATH);
  const existingIndex = conversations.findIndex(
    (item) => item.id === conversation.id,
  );

  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.unshift(conversation);
  }

  await writeJson(CONVERSATIONS_PATH, conversations);
  return conversation;
}
