import { z } from "zod";

export const inquirySchema = z.object({
  type: z.string().min(1, "Type is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  metadata: z.record(z.string(), z.any()).optional(),
  turnstileToken: z.string().optional()
});

export type InquiryPayload = z.infer<typeof inquirySchema>;
