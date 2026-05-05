import { z } from "zod";

// Define a more specific schema for Tiptap AST nodes
const tiptapNodeSchema: z.ZodType<{
  type?: string;
  content?: unknown[];
  attrs?: Record<string, unknown>;
  marks?: unknown[];
  text?: string;
}> = z.object({
  type: z.string().optional(),
  content: z.array(z.lazy(() => tiptapNodeSchema)).optional(),
  attrs: z.record(z.string(), z.unknown()).optional(),
  marks: z.array(z.unknown()).optional(),
  text: z.string().optional(),
});

export const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().max(255).optional(),
  thumbnail: z.string().max(255).optional().or(z.literal("")),
  ast: tiptapNodeSchema, // JSON AST from Tiptap - validated structure
  socials: z.record(z.string().max(255), z.boolean()).optional(),
  isDraft: z.boolean().optional(),
  publishedAt: z.string().max(255).optional(),
  seasonId: z.union([z.string(), z.number()]).transform(v => v === "" ? undefined : Number(v)).optional(),
});

export type PostPayload = z.infer<typeof postSchema>;
