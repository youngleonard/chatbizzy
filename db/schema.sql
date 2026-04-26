-- Run this once against your Vercel Postgres database.
-- You can paste it into the Vercel dashboard query editor or any psql client.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast cosine-similarity search.
-- Optional for tiny datasets but free to add early.
CREATE INDEX IF NOT EXISTS documents_embedding_hnsw
  ON documents USING hnsw (embedding vector_cosine_ops);
