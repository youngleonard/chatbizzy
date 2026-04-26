import { NextResponse } from "next/server";

// Temporary diagnostic endpoint. Reports presence + length of env vars
// (NEVER values) so we can verify what the runtime can actually see.
// Delete this file once the chatbot is working.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const keys = [
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "DATABASE_URL",
  ];

  const report = Object.fromEntries(
    keys.map((k) => {
      const v = process.env[k];
      return [
        k,
        {
          present: typeof v === "string" && v.length > 0,
          length: typeof v === "string" ? v.length : 0,
        },
      ];
    }),
  );

  // Also list any env vars that look related, in case the name is slightly off.
  const fuzzy = Object.keys(process.env)
    .filter((k) => /GOOGLE|GEMINI|POSTGRES|DATABASE/i.test(k))
    .sort();

  return NextResponse.json({ report, fuzzy });
}
