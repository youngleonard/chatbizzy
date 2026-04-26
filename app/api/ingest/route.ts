import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { embedTexts, toVectorLiteral } from "@/lib/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  text: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  // Optional overrides; defaults are sane.
  chunkSize: z.number().int().positive().optional(),
  chunkOverlap: z.number().int().min(0).optional(),
});

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 100;

/**
 * Naive chunker: walks the text in fixed-size windows with overlap.
 * Tries to break on whitespace near the window boundary to avoid
 * cutting words in half. Good enough for a workshop.
 */
function chunkText(
  text: string,
  size = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP,
): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (cleaned.length <= size) return [cleaned];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + size, cleaned.length);

    // If we're not at the very end, try to back off to the nearest whitespace
    // so we don't slice through a word.
    if (end < cleaned.length) {
      const lastSpace = cleaned.lastIndexOf(" ", end);
      if (lastSpace > start + size * 0.5) {
        end = lastSpace;
      }
    }

    chunks.push(cleaned.slice(start, end).trim());

    if (end >= cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks.filter((c) => c.length > 0);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { text, metadata = {}, chunkSize, chunkOverlap } = parsed.data;

  const chunks = chunkText(text, chunkSize, chunkOverlap);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "No content to ingest" }, { status: 400 });
  }

  const embeddings = await embedTexts(chunks);

  // Insert all chunks. For a workshop this loop is fine; if you need to
  // ingest tens of thousands of chunks, switch to a multi-row INSERT.
  const insertedIds: number[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];
    const embedding = embeddings[i];
    const chunkMeta = {
      ...metadata,
      chunkIndex: i,
      totalChunks: chunks.length,
    };
    const vectorLiteral = toVectorLiteral(embedding);

    const { rows } = await sql<{ id: number }>`
      INSERT INTO documents (content, embedding, metadata)
      VALUES (
        ${content},
        ${vectorLiteral}::vector,
        ${JSON.stringify(chunkMeta)}::jsonb
      )
      RETURNING id;
    `;
    if (rows[0]) insertedIds.push(rows[0].id);
  }

  return NextResponse.json({
    inserted: insertedIds.length,
    chunks: chunks.length,
    ids: insertedIds,
  });
}
