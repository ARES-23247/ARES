import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { standardErrors } from "./common";

const errorSchema = z.object({ error: z.string() });
const c = initContract();

export const aiContract = c.router({
  liveblocksCopilot: {
    method: "POST",
    path: "/liveblocks-copilot",
    responses: {
      ...standardErrors,
      // Server-Sent Events (SSE) don't have a standard ts-rest response type,
      // but we define the expected success response for completeness.
      200: z.any(),
      400: errorSchema,
      401: errorSchema,
      429: errorSchema,
      500: errorSchema,
    },
    body: z.object({
      documentContext: z.string(),
      prompt: z.string(),
      action: z.enum(["summarize", "expand", "question", "ghost-text"]),
    }),
    summary: "Interact with the Liveblocks AI Copilot via SSE",
  },
  ragChatbot: {
    method: "POST",
    path: "/rag-chatbot",
    responses: {
      ...standardErrors,
      200: z.any(),
      400: errorSchema,
      401: errorSchema,
      429: errorSchema,
      500: errorSchema,
    },
    body: z.object({
      query: z.string(),
      turnstileToken: z.string(),
      sessionId: z.string().optional(),
    }),
    summary: "Query the Global RAG Chatbot via SSE",
  },
});
export type AiContract = typeof aiContract;
