import { Hono } from "hono";
import { createHonoEndpoints } from "ts-rest-hono";
import { pointsContract } from "../../../shared/schemas/contracts/pointsContract";
import type { AppEnv, HonoContext } from "../../../shared/types/api";
import { s } from "../middleware";
import { Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";

const app = new Hono<AppEnv>();

type HandlerInput = {
  params: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
};

const pointsTsRestRouter = s.router(pointsContract, {
  getBalance: async (input: HandlerInput, c: HonoContext) => {
    const user_id = input.params.user_id;
    try {
      const sessionUser = c.get("sessionUser");
      if (!sessionUser) {
        return { status: 401, body: { error: "Unauthorized" } };
      }

      if (sessionUser.role !== "admin" && sessionUser.id !== user_id) {
        return { status: 403, body: { error: "Forbidden" } };
      }

      const db = c.get("db") as Kysely<DB>;
      const ledger = await db
        .selectFrom("points_ledger")
        .select(["points_delta"])
        .where("user_id", "=", user_id)
        .execute();

      const balance = ledger.reduce((sum, tx) => sum + tx.points_delta, 0);

      return {
        status: 200,
        body: { user_id, balance }
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[Points] Get balance failed:", error);
      return { status: 500, body: { error: error.message } };
    }
  },
  getHistory: async (input: HandlerInput, c: HonoContext) => {
    const user_id = input.params.user_id;
    try {
      const sessionUser = c.get("sessionUser");
      if (!sessionUser) {
        return { status: 401, body: { error: "Unauthorized" } };
      }

      if (sessionUser.role !== "admin" && sessionUser.id !== user_id) {
        return { status: 403, body: { error: "Forbidden" } };
      }

      const db = c.get("db") as Kysely<DB>;
      const history = await db
        .selectFrom("points_ledger")
        .selectAll()
        .where("user_id", "=", user_id)
        .orderBy("created_at", "desc")
        .execute();

      return {
        status: 200,
        body: history.map((tx) => ({
          ...tx,
          id: tx.id || "",
          created_at: tx.created_at || null
        }))
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[Points] Get history failed:", error);
      return { status: 500, body: { error: error.message } };
    }
  },
  awardPoints: async (input: HandlerInput, c: HonoContext) => {
    const { user_id, points_delta, reason } = input.body as { user_id: string; points_delta: number; reason: string };
    try {
      const sessionUser = c.get("sessionUser");
      if (!sessionUser || sessionUser.role !== "admin") {
        return { status: 401, body: { error: "Unauthorized" } };
      }

      const db = c.get("db") as Kysely<DB>;

      const id = crypto.randomUUID();

      const newTx = {
        id,
        user_id,
        points_delta,
        reason,
        created_at: new Date().toISOString(),
        created_by: sessionUser.id
      };

      await db.insertInto("points_ledger").values(newTx).execute();

      return {
        status: 201,
        body: { 
          success: true, 
          transaction_id: id 
        }
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[Points] Award points failed:", error);
      return { status: 500, body: { error: error.message } };
    }
  },
  getLeaderboard: async (_: HandlerInput, c: HonoContext) => {
    try {
      const db = c.get("db") as Kysely<DB>;

      const results = await db
        .selectFrom("user")
        .leftJoin("points_ledger", "user.id", "points_ledger.user_id")
        .select([
          "user.id",
          "user.name",
          "user.role",
          (eb) => eb.fn.sum<number>("points_ledger.points_delta").as("points_balance")
        ])
        .groupBy("user.id")
        .orderBy("points_balance", "desc")
        .limit(50)
        .execute();

      const leaderboard = results.map((r) => {
        return {
          id: String(r.id),
          name: r.name || "Anonymous",
          nickname: null,
          member_type: String(r.role || "student"),
          points_balance: Number(r.points_balance || 0),
          avatar: null
        };
      });

      return { status: 200, body: { leaderboard } };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[Points] Get leaderboard failed:", error);
      return { status: 500, body: { error: error.message } };
    }
  }
} as any);

createHonoEndpoints(
  pointsContract,
  pointsTsRestRouter,
  app,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, _c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);

export default app;
