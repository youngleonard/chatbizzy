import { google } from "@ai-sdk/google";
import { streamText, type Message } from "ai";
import { buildSystemPrompt, retrieveRelevantChunks } from "@/lib/rag";

// Run on the Node.js runtime so @vercel/postgres works.
export const runtime = "nodejs";
// Don't cache. Chat is dynamic by definition.
export const dynamic = "force-dynamic";
// Hard cap so a runaway request can't burn budget.
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const userQuery = lastUserMessage?.content ?? "";

  // Retrieve top-K relevant chunks for the latest user message only.
  // (For a workshop this is fine; for production you might condense the
  //  full history into a search query first.)
  const chunks = userQuery
    ? await retrieveRelevantChunks(userQuery, 5)
    : [];

  const system = buildSystemPrompt(chunks);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system,
    messages,
  });

  return result.toDataStreamResponse();
}
