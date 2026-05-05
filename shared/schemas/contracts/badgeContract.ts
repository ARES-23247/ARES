import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const badgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  color_theme: z.string(),
  created_at: z.string(),
});

export const userBadgeSchema = z.object({
  user_id: z.string(),
  badge_id: z.string(),
  granted_at: z.string(),
});

export const badgeContract = c.router({
  list: {
    method: "GET",
    path: "/",
    responses: {
      200: z.object({
        badges: z.array(badgeSchema),
      }),
      500: z.object({ error: z.string() }),
    },
    summary: "List all badge definitions",
  },
  create: {
    method: "POST",
    path: "/admin",
    body: badgeSchema.omit({ created_at: true }),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      401: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
    summary: "Create a new badge definition",
  },
  grant: {
    method: "POST",
    path: "/admin/grant",
    body: z.object({
      userId: z.string(),
      badgeId: z.string(),
    }),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      401: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
    summary: "Grant a badge to a user",
  },
  revoke: {
    method: "DELETE",
    path: "/admin/grant/:userId/:badgeId",
    pathParams: z.object({
      userId: z.string(),
      badgeId: z.string(),
    }),
    body: c.type<null>(),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      401: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
    summary: "Revoke a badge from a user",
  },
  delete: {
    method: "DELETE",
    path: "/admin/:id",
    pathParams: z.object({
      id: z.string(),
    }),
    body: c.type<null>(),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      401: z.object({ error: z.string() }),
      500: z.object({ error: z.string() }),
    },
    summary: "Delete a badge definition",
  },
  leaderboard: {
    method: "GET",
    path: "/leaderboard",
    responses: {
      200: z.object({
        leaderboard: z.array(z.object({
          user_id: z.string(),
          nickname: z.string().nullable(),
          member_type: z.string().nullable(),
          badge_count: z.number(), // Always return number for consistency
        })),
      }),
      500: z.object({ error: z.string() }),
    },
    summary: "Get public badge leaderboard",
  },
});
export type BadgeContract = typeof badgeContract;
