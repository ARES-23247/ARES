import { z } from "zod";

export const locationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  contact_info: z.string().optional().nullable(),
  is_deleted: z.number().default(0)
});

export type LocationPayload = z.infer<typeof locationSchema>;
