# Chatbizzy

A general-purpose RAG chatbot built on Next.js (App Router), Vercel Postgres + pgvector, Gemini 2.5 Flash for generation, and Gemini `text-embedding-004` for embeddings.

## How it works

1. User sends a query
2. Server embeds the query with `text-embedding-004` (768-dim)
3. Cosine-similarity search against `documents` table returns top 5 chunks
4. Those chunks plus the message history go to Gemini 2.5 Flash via `streamText`
5. Response streams back to the UI through the Vercel AI SDK

## Stack

- Next.js 15 (App Router) on Vercel
- Vercel Postgres with the `pgvector` extension
- Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
- Zod for request validation

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

Create a Postgres database in your Vercel dashboard (Storage tab) and link it to the project. Vercel will inject the connection string into your project env. Locally, copy it into `.env.local`.

Then run the schema once. Paste the contents of `db/schema.sql` into the Vercel query editor (or run it via psql).

### 3. Set environment variables

Copy `.env.example` to `.env.local` and fill in:

```
GOOGLE_GENERATIVE_AI_API_KEY=...
POSTGRES_URL=...
```

The Google key comes from [Google AI Studio](https://aistudio.google.com/). The Postgres URL comes from the Vercel Storage tab.

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### 5. Deploy

Push to GitHub, then import the repo in Vercel. Add the same two env vars in the Vercel project settings. Done.

## Ingesting documents

The chat is empty until you load it with content. Post text to `/api/ingest`:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Paste a chunk of source material here. It will be split into ~800-character chunks with 100-character overlap, embedded, and stored.",
    "metadata": { "source": "example-doc", "url": "https://example.com" }
  }'
```

Verify rows landed:

```sql
SELECT id, left(content, 60) AS preview, metadata, created_at
FROM documents
ORDER BY id DESC
LIMIT 5;
```

For PDFs or web pages, parse them on your machine first (e.g. `pdf-parse`, a scraper) and POST the extracted text to `/api/ingest`.

## Project layout

```
app/
  page.tsx                 # chat UI (useChat from @ai-sdk/react)
  layout.tsx               # root layout
  globals.css              # base styles
  api/
    chat/route.ts          # streaming chat endpoint with RAG
    ingest/route.ts        # chunk + embed + insert
lib/
  db.ts                    # @vercel/postgres client
  embeddings.ts            # Gemini embedding wrapper + vector literal helper
  rag.ts                   # query embedding + similarity search + system prompt
db/
  schema.sql               # one-time DB setup
```

## Things worth knowing

- The chunker is naive (fixed window with overlap, soft-broken on whitespace). For production, switch to a structure-aware splitter (e.g. by heading, by sentence) — RAG quality lives or dies on chunk quality.
- The chat endpoint embeds only the latest user message. Multi-turn questions like "and what about the second one?" won't retrieve well. A real system would condense the conversation into a search query first.
- Cosine distance via `<=>` requires the `vector_cosine_ops` index (which `db/schema.sql` creates). If you switch to L2 distance (`<->`) or inner product (`<#>`), change the index too.
- The `documents.embedding` column is `VECTOR(768)` because `text-embedding-004` outputs 768 dims. Swap embedding models and you'll need a new column dimension and a re-ingest.
