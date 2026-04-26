import { sql } from "@vercel/postgres";

// Re-export the @vercel/postgres tagged-template client.
// It picks up POSTGRES_URL from the environment automatically.
//
// Use it like:
//   import { sql } from "@/lib/db";
//   const { rows } = await sql`SELECT 1 AS hello`;
//
// For the pgvector cosine distance operator, pass the embedding as a
// stringified array and cast to ::vector inside the query. See lib/rag.ts.
export { sql };
