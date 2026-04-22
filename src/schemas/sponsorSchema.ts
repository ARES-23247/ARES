import { z } from "zod";

export const sponsorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  tier: z.string().min(1, "Tier is required"),
  logo_url: z.string().url("Must be a valid URL").optional().nullable(),
  website: z.string().url("Must be a valid URL").optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.number().default(1),
  since_year: z.number().optional().nullable()
});

export type SponsorPayload = z.infer<typeof sponsorSchema>;
