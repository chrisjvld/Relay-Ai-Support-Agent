import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { config } from "dotenv";
import matter from "gray-matter";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import type { KnowledgeArticle, KnowledgeChunk } from "../lib/types";

config({ path: path.join(process.cwd(), ".env.local") });

const KNOWLEDGE_DIR = path.join(process.cwd(), "data/knowledge");
const OUTPUT_PATH = path.join(process.cwd(), "data/generated/kb-index.json");

function splitIntoChunks(article: KnowledgeArticle) {
  const sections = article.content
    .split(/\n(?=## )/)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.flatMap((section) => {
    if (section.length <= 1_000) return [section];

    const paragraphs = section.split(/\n\n+/);
    const chunks: string[] = [];
    let current = "";

    for (const paragraph of paragraphs) {
      if (`${current}\n\n${paragraph}`.length > 1_000 && current) {
        chunks.push(current.trim());
        current = paragraph;
      } else {
        current = `${current}\n\n${paragraph}`.trim();
      }
    }

    if (current) chunks.push(current.trim());
    return chunks;
  });
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is missing. Copy .env.example to .env.local and add your key.",
    );
  }

  const fileNames = (await readdir(KNOWLEDGE_DIR))
    .filter((name) => name.endsWith(".md"))
    .sort();

  const articles = await Promise.all(
    fileNames.map(async (fileName): Promise<KnowledgeArticle> => {
      const raw = await readFile(path.join(KNOWLEDGE_DIR, fileName), "utf8");
      const { data, content } = matter(raw);

      return {
        id: String(data.id),
        slug: fileName.replace(/\.md$/, ""),
        title: String(data.title),
        category: String(data.category),
        summary: String(data.summary),
        updatedAt: String(data.updatedAt),
        content: content.trim(),
      };
    }),
  );

  const pendingChunks = articles.flatMap((article) =>
    splitIntoChunks(article).map((text, index) => ({
      article,
      text,
      chunkId: `${article.id}-${index + 1}`,
    })),
  );

  const { embeddings } = await embedMany({
    model: openai.embedding(
      process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    ),
    values: pendingChunks.map(
      ({ article, text }) =>
        `${article.title}\n${article.summary}\n${text}`,
    ),
  });

  const index: KnowledgeChunk[] = pendingChunks.map(
    ({ article, text, chunkId }, position) => ({
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      category: article.category,
      chunkId,
      text,
      embedding: embeddings[position],
    }),
  );

  await writeFile(OUTPUT_PATH, `${JSON.stringify(index)}\n`, "utf8");
  console.log(
    `Seeded ${index.length} chunks from ${articles.length} Fjellvik articles.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
