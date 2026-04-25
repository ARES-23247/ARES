import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const zulipPresenceSchema = z.record(z.string(), z.object({
  active: z.object({
    status: z.string(),
    timestamp: z.number(),
  }).optional(),
  idle: z.object({
    status: z.string(),
    timestamp: z.number(),
  }).optional(),
}));

export const zulipContract = c.router({
  getPresence: {
    method: "GET",
    path: "/presence",
    responses: {
      200: z.object({
        success: z.boolean(),
        presence: zulipPresenceSchema,
      }),
      500: z.object({ success: z.boolean(), error: z.string() }),
    },
    summary: "Get Zulip team presence",
  },
});
