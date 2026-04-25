import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const commentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nickname: z.string().nullable(),
  avatar: z.string().nullable(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const commentContract = c.router({
  list: {
    method: "GET",
    path: "/:targetType/:targetId",
    pathParams: z.object({
      targetType: z.enum(["post", "event", "doc"]),
      targetId: z.string(),
    }),
    responses: {
      200: z.object({
        comments: z.array(commentSchema),
        authenticated: z.boolean(),
        role: z.string().nullable(),
      }),
    },
    summary: "List comments for a target",
  },
  submit: {
    method: "POST",
    path: "/:targetType/:targetId",
    pathParams: z.object({
      targetType: z.enum(["post", "event", "doc"]),
      targetId: z.string(),
    }),
    body: z.object({
      content: z.string(),
    }),
    responses: {
      200: z.object({ success: z.boolean() }),
    },
    summary: "Submit a new comment",
  },
  update: {
    method: "PATCH",
    path: "/:id",
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.object({
      content: z.string(),
    }),
    responses: {
      200: z.object({ success: z.boolean() }),
    },
    summary: "Update an existing comment",
  },
  delete: {
    method: "DELETE",
    path: "/:id",
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.object({}),
    responses: {
      200: z.object({ success: z.boolean() }),
    },
    summary: "Delete a comment",
  },
});
