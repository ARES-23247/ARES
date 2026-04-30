import { Hono } from "hono";
import { AppEnv } from "../../middleware";
import { streamSSE } from "hono/streaming";

export const aiRouter = new Hono<AppEnv>();

// PII Scrubber Utility
const scrubPII = (text: string): string => {
  // Simple regex to scrub emails and phone numbers
  let scrubbed = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
  scrubbed = scrubbed.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[REDACTED_PHONE]");
  return scrubbed;
};

// ── Liveblocks AI Copilot Endpoint ────────────────────────────────────────

aiRouter.post("/liveblocks-copilot", async (c) => {
  const body = await c.req.json();
  const { documentContext, prompt, action } = body;

  if (!c.env.AI && !c.env.Z_AI_API_KEY) {
    return c.json({ error: "AI service not configured" }, 500);
  }

  const safeContext = scrubPII(documentContext || "");
  const safePrompt = scrubPII(prompt || "");

  // Here we would normally dispatch to z.ai via HTTP streaming.
  // For MVP/Setup, we'll simulate an SSE stream returning mock data.
  // In real implementation, you'd fetch from z.ai (Anthropic API format) and pipe the stream.
  
  return streamSSE(c, async (stream) => {
    const messages = [
      `Action: ${action}`,
      `Processing context securely...`,
      `[AI RESPONSE STREAMING MOCK]`,
      `Finished.`
    ];

    for (const msg of messages) {
      await stream.writeSSE({ data: JSON.stringify({ chunk: msg }) });
      await stream.sleep(500);
    }
  });
});

// ── RAG Chatbot Endpoint ──────────────────────────────────────────────────

aiRouter.post("/rag-chatbot", async (c) => {
  const body = await c.req.json();
  const { query, turnstileToken, sessionId } = body;

  if (!query || !turnstileToken) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Validate Turnstile (Mock validation for now)
  const isBot = false;
  if (isBot) {
    return c.json({ error: "Turnstile validation failed" }, 403);
  }

  const safeQuery = scrubPII(query);

  // Generate embedding using Cloudflare Workers AI
  let embeddingVector: number[] = [];
  try {
    if (c.env.AI) {
      // @ts-ignore - CF AI bindings
      const response = await c.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [safeQuery] });
      embeddingVector = response.data[0];
    }
  } catch (e) {
    console.error("Embedding generation failed:", e);
  }

  // Query Vectorize DB
  let contextDocs = "";
  try {
    if (c.env.VECTORIZE_DB && embeddingVector.length > 0) {
      const vecRes = await c.env.VECTORIZE_DB.query(embeddingVector, { topK: 3, returnMetadata: true });
      contextDocs = vecRes.matches.map((m: any) => m.metadata?.text || "").join("\n\n");
    }
  } catch (e) {
    console.error("Vectorize query failed:", e);
  }

  return streamSSE(c, async (stream) => {
    await stream.writeSSE({ data: JSON.stringify({ chunk: `[RAG System] Found context: ${contextDocs ? 'Yes' : 'No'}` }) });
    await stream.sleep(500);
    await stream.writeSSE({ data: JSON.stringify({ chunk: `\n[AI] Replying to: ${safeQuery}` }) });
    
    // Log history to D1
    try {
      const db = c.get("db");
      const sid = sessionId || crypto.randomUUID();
      // Implementation for history storage...
    } catch (e) {
      // Ignore D1 errors for stream
    }
  });
});

export default aiRouter;
