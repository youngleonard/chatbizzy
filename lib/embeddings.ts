import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

// gemini-embedding-001 is Google's current embedding model.
// (text-embedding-004 was removed from the v1beta endpoint.)
//
// It defaults to 3072 dims but supports Matryoshka downscaling, so we
// request 768 to keep our existing VECTOR(768) column in db/schema.sql.
// If you swap models or dimensions, change the column and re-ingest.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

export const embeddingModel = google.textEmbeddingModel(EMBEDDING_MODEL, {
  outputDimensionality: EMBEDDING_DIMENSIONS,
});

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
