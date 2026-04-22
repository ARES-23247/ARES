import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  coverImageUrl: z.string().url("Cover asset must be a valid URL").optional().or(z.literal("")),
  ast: z.record(z.string(), z.any()), // JSON AST from Tiptap
  socials: z.record(z.string(), z.boolean()).optional(),
  isDraft: z.boolean().optional(),
  publishedAt: z.string().optional(),
});

export type PostPayload = z.infer<typeof postSchema>;
