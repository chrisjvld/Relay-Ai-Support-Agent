export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] ** 2;
    normB += b[index] ** 2;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
