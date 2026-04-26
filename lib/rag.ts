import { sql } from "@/lib/db";
import { embedText, toVectorLiteral } from "@/lib/embeddings";

export type RetrievedChunk = {
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

/**
 * Embed a query and return the top-K most similar document chunks
 * using pgvector cosine distance.
 *
 * The `<=>` operator returns cosine distance (smaller = closer).
 * `1 - distance` converts to similarity (larger = closer), which is
 * easier to reason about downstream.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK = 5,
): Promise<RetrievedChunk[]> {
  const embedding = await embedText(query);
  const vectorLiteral = toVectorLiteral(embedding);

  const { rows } = await sql<{
    content: string;
    metadata: Record<string, unknown>;
    similarity: number;
  }>`
    SELECT
      content,
      metadata,
      1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM documents
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK};
  `;

  return rows;
}

/**
 * Build a system prompt that grounds the model in the retrieved chunks.
 * The model is told to answer from the context and to admit when it can't.
 */
export function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return [
      "You are a helpful assistant.",
      "No relevant context was found for the user's question.",
      "If the user is asking about a specific topic that should be in the knowledge base,",
      "say you don't have information on it rather than guessing.",
    ].join(" ");
  }

  const contextBlock = chunks
    .map((c, i) => {
      const sourceHint =
        c.metadata && typeof c.metadata === "object" && "source" in c.metadata
          ? ` (source: ${String((c.metadata as { source?: unknown }).source)})`
          : "";
      return `[${i + 1}]${sourceHint}\n${c.content}`;
    })
    .join("\n\n---\n\n");

  return [
    "You are a helpful assistant. Answer the user's question using ONLY the context below.",
    "If the answer is not in the context, say you don't know. Do not make things up.",
    "When useful, cite the source numbers in brackets like [1], [2].",
    "",
    "Context:",
    contextBlock,
  ].join("\n");
}
