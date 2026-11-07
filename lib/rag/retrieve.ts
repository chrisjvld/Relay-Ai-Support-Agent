import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import type { KnowledgeChunk, KnowledgeSource } from "@/lib/types";
import { cosineSimilarity } from "./cosine";

const INDEX_PATH = path.join(process.cwd(), "data/generated/kb-index.json");
const MIN_SCORE = 0.24;
const MAX_RESULTS = 3;

let cachedIndex: KnowledgeChunk[] | null = null;

async function readIndex() {
  if (cachedIndex) return cachedIndex;
  const raw = await readFile(INDEX_PATH, "utf8");
  cachedIndex = JSON.parse(raw) as KnowledgeChunk[];
  return cachedIndex;
}

export async function retrieveKnowledge(query: string): Promise<KnowledgeSource[]> {
  const index = await readIndex();

  if (index.length === 0) {
    throw new Error(
      "The knowledge index is empty. Run `npm run seed` after adding OPENAI_API_KEY to .env.local.",
    );
  }

  const { embedding } = await embed({
    model: openai.embedding(
      process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    ),
    value: query,
  });

  const ranked = index
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(embedding, chunk.embedding),
    }))
    .filter(({ score }) => score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  const uniqueArticles = new Map<string, KnowledgeSource>();

  for (const { chunk, score } of ranked) {
    if (!uniqueArticles.has(chunk.articleId)) {
      uniqueArticles.set(chunk.articleId, {
        articleId: chunk.articleId,
        slug: chunk.slug,
        title: chunk.title,
        category: chunk.category,
        excerpt: chunk.text,
        score: Number(score.toFixed(3)),
      });
    }

    if (uniqueArticles.size >= MAX_RESULTS) break;
  }

  return [...uniqueArticles.values()];
}
