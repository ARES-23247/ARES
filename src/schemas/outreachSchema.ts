import { z } from "zod";

export const outreachSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  location: z.string().nullable().optional(),
  students_count: z.number().min(0).default(0),
  hours_logged: z.number().min(0).default(0),
  reach_count: z.number().min(0).default(0),
  description: z.string().nullable().optional(),
  is_dynamic: z.boolean().optional()
});

export type OutreachPayload = z.infer<typeof outreachSchema>;
