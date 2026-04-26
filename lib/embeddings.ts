import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

// Gemini text-embedding-004 returns 768-dimensional vectors.
// If you swap models, also change the VECTOR(768) column in db/schema.sql.
const EMBEDDING_MODEL = "text-embedding-004";

export const embeddingModel = google.textEmbeddingModel(EMBEDDING_MODEL);

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });
  return embeddings;
}

// pgvector accepts a vector literal in the form '[0.1,0.2,...]'.
// Cast to ::vector inside the SQL query, e.g.:
//   sql`... ${toVectorLiteral(embedding)}::vector ...`
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
