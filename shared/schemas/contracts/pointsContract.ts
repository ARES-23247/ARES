import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { standardErrors } from "./common";

const c = initContract();

export const PointsTransactionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  points_delta: z.number(),
  reason: z.string(),
  created_by: z.string(),
  created_at: z.string().nullable(),
});

export const PointsBalanceSchema = z.object({
  user_id: z.string(),
  balance: z.number(),
});

export const PointsLeaderboardEntrySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  nickname: z.string().nullable(),
  member_type: z.string().nullable(),
  points_balance: z.number(),
  avatar: z.string().nullable(),
});

export const pointsContract = c.router({
  getBalance: {
    method: "GET",
    path: "/balance/:user_id",
    pathParams: z.object({ user_id: z.string() }),
    responses: {
      ...standardErrors,
      200: PointsBalanceSchema,
    },
    summary: "Get user point balance",
  },
  getHistory: {
    method: "GET",
    path: "/history/:user_id",
    pathParams: z.object({ user_id: z.string() }),
    responses: {
      ...standardErrors,
      200: z.array(PointsTransactionSchema),
    },
    summary: "Get user point history",
  },
  awardPoints: {
    method: "POST",
    path: "/transaction",
    body: z.object({
      user_id: z.string(),
      points_delta: z.number(),
      reason: z.string().min(1),
    }),
    responses: {
      ...standardErrors,
      201: z.object({ 
        success: z.boolean(), 
        transaction_id: z.string() 
      }),
    },
    summary: "Award or deduct points (Admin)",
  },
  getLeaderboard: {
    method: "GET",
    path: "/leaderboard",
    responses: {
      ...standardErrors,
      200: z.object({
        leaderboard: z.array(PointsLeaderboardEntrySchema),
      }),
    },
    summary: "Get global points leaderboard",
  },
});

export type PointsContract = typeof pointsContract;
