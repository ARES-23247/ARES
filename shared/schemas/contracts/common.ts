import { z } from "zod";

export const standardErrors = {
  400: z.object({ error: z.string(), details: z.any().optional(), success: z.boolean().optional(), message: z.string().optional(), recipientCount: z.number().optional() }),
  401: z.object({ error: z.string(), user_id: z.string().optional(), balance: z.number().optional() }),
  403: z.object({ error: z.string(), user_id: z.string().optional(), balance: z.number().optional() }),
  404: z.object({ error: z.string(), success: z.boolean().optional() }),
  429: z.object({ error: z.string() }),
  500: z.object({ error: z.string(), success: z.boolean().optional() }),
};
