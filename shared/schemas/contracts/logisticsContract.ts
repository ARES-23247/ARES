import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const logisticsSummarySchema = z.object({
  totalCount: z.number(),
  memberCounts: z.record(z.string(), z.number()),
  dietary: z.record(z.string(), z.number()),
  tshirts: z.record(z.string(), z.number()),
});

export const logisticsContract = c.router({
  getSummary: {
    method: "GET",
    path: "/admin/summary",
    responses: {
      200: logisticsSummarySchema,
      401: z.object({ error: z.string() }),
      403: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
    summary: "Get aggregated logistics for event planning",
  },
  exportEmails: {
    method: "GET",
    path: "/admin/export-emails",
    responses: {
      200: z.object({
        users: z.array(z.object({
          name: z.string(),
          email: z.string(),
          role: z.string(),
          emergencyName: z.string().nullable().optional(),
          emergencyPhone: z.string().nullable().optional(),
        }))
      }),
      401: z.object({ error: z.string() }),
      403: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
    summary: "Get all active member emails for mass communication",
  },
});
export type LogisticsContract = typeof logisticsContract;
