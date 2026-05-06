import { Hono } from "hono";
import { createHonoEndpoints } from "ts-rest-hono";
import { analyticsContract } from "../../../shared/schemas/contracts/analyticsContract";
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

const analyticsTsRestRouter = s.router(analyticsContract, {
  trackPage: async (input: HandlerInput, c: HonoContext) => {
    const { path, referrer, user_agent } = input.body as { path: string; referrer?: string; user_agent?: string };
    try {
      const db = c.get("db") as Kysely<DB>;
      await db
        .insertInto("page_analytics")
        .values({
          path,
          referrer: referrer || null,
          user_agent: user_agent || null,
          timestamp: new Date().toISOString()
        })
        .execute();

      return { status: 201, body: { success: true } };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[Analytics] Track page failed:", error);
      return { status: 500, body: { error: error.message } };
    }
  },

  getStats: async (_: HandlerInput, c: HonoContext) => {
    try {
      const sessionUser = c.get("sessionUser");
      if (!sessionUser || sessionUser.role !== "admin") {
        return { status: 403, body: { error: "Forbidden" } };
      }

      const db = c.get("db") as Kysely<DB>;
      const stats = await db
        .selectFrom("page_analytics")
        .select([
          "path",
          (eb) => eb.fn.count("id").as("visits")
        ])
        .groupBy("path")
        .orderBy("visits", "desc")
        .execute();

      return {
        status: 200,
        body: {
          stats: stats.map((s) => ({
            path: s.path,
            visits: Number(s.visits)
          }))
        }
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("[Analytics] Get stats failed:", error);
      return { status: 500, body: { error: error.message } };
    }
  }
} as any);

createHonoEndpoints(
  analyticsContract,
  analyticsTsRestRouter,
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
