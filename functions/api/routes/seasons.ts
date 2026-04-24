/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { seasonContract as seasonsContract } from "../../../src/schemas/contracts/seasonContract";
import { AppEnv, ensureAdmin, logAuditAction, rateLimitMiddleware } from "../middleware";

const s = initServer<AppEnv>();
const seasonsRouter = new Hono<AppEnv>();

const seasonsHandlers: any = {
  list: async (_: any, c: any) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("seasons")
        .selectAll()
        .where("is_deleted", "=", 0)
        .where("status", "=", "published")
        .orderBy("start_year", "desc")
        .execute();
      return { status: 200, body: { seasons: results as unknown as unknown[] } };
    } catch {
      return { status: 500, body: { error: "Failed to fetch seasons" } };
    }
  },
  adminList: async (_: any, c: any) => {
    const db = c.get("db");
    try {
      const seasons = await db.selectFrom("seasons")
        .selectAll()
        .orderBy("start_year", "desc")
        .execute();
      return { status: 200, body: { seasons: seasons as unknown as unknown[] } };
    } catch {
      return { status: 500, body: { error: "Failed to list seasons" } };
    }
  },
  adminDetail: async ({ params }: any, c: any) => {
    const db = c.get("db");
    try {
      const season = await db.selectFrom("seasons")
        .selectAll()
        .where("id", "=", params.id)
        .executeTakeFirst();
      if (!season) return { status: 404, body: { error: "Season not found" } };
      return { status: 200, body: { season: season as unknown as unknown } };
    } catch {
      return { status: 500, body: { error: "Failed to fetch season" } };
    }
  },
  getDetail: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db");
      const year = parseInt(params.year);
      if (isNaN(year)) return { status: 404, body: { error: "Invalid year" } };

      const [season, awards, events, posts, outreach] = await Promise.all([
        db.selectFrom("seasons").selectAll().where("start_year", "=", year).executeTakeFirst(),
        db.selectFrom("awards").selectAll().where("season_id", "=", year.toString()).execute(),
        db.selectFrom("events").selectAll().where("season_id", "=", year.toString()).where("is_deleted", "=", 0).execute(),
        db.selectFrom("posts").selectAll().where("season_id", "=", year.toString()).where("is_deleted", "=", 0).execute(),
        db.selectFrom("outreach_logs" as unknown).selectAll().where("season_id", "=", year).execute(),
      ]);

      if (!season) return { status: 404, body: { error: "Season not found" } };

      return {
        status: 200,
        body: {
          season: season as unknown as unknown,
          awards: awards as unknown as unknown[],
          events: events as unknown as unknown[],
          posts: posts as unknown as unknown[],
          outreach: outreach as unknown as unknown[],
        }
      };
    } catch {
      return { status: 500, body: { error: "Failed to fetch season details" } };
    }
  },
  save: async ({ body }: any, c: any) => {
    try {
      const db = c.get("db");
      const existing = await db.selectFrom("seasons")
        .select("start_year")
        .where("start_year", "=", body.start_year)
        .executeTakeFirst();

      if (existing) {
        await db.updateTable("seasons")
          .set({
            end_year: body.end_year,
            challenge_name: body.challenge_name,
            robot_name: body.robot_name,
            robot_image: body.robot_image,
            robot_description: body.robot_description,
            robot_cad_url: body.robot_cad_url,
            summary: body.summary,
            album_url: body.album_url,
            album_cover: body.album_cover,
            status: body.status,
            updated_at: new Date().toISOString(),
          })
          .where("start_year", "=", body.start_year)
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "season_updated", "seasons", body.start_year.toString(), `Season "${body.start_year}" updated`));
      } else {
        await db.insertInto("seasons")
          .values({
            start_year: body.start_year,
            end_year: body.end_year,
            challenge_name: body.challenge_name,
            robot_name: body.robot_name,
            robot_image: body.robot_image,
            robot_description: body.robot_description,
            robot_cad_url: body.robot_cad_url,
            summary: body.summary,
            album_url: body.album_url,
            album_cover: body.album_cover,
            status: body.status,
          })
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "season_created", "seasons", body.start_year.toString(), `Season "${body.start_year}" created`));
      }
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Save failed" } };
    }
  },
  delete: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db");
      const year = parseInt(params.id);
      await db.updateTable("seasons")
        .set({ is_deleted: 1 })
        .where("start_year", "=", year)
        .execute();
      c.executionCtx.waitUntil(logAuditAction(c, "season_deleted", "seasons", params.id, `Season "${params.id}" soft-deleted`));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Delete failed" } };
    }
  },
  undelete: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db");
      const year = parseInt(params.id);
      await db.updateTable("seasons")
        .set({ is_deleted: 0 })
        .where("start_year", "=", year)
        .execute();
      c.executionCtx.waitUntil(logAuditAction(c, "season_restored", "seasons", params.id, `Season "${params.id}" restored`));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Restore failed" } };
    }
  },
  purge: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db");
      const year = parseInt(params.id);
      await db.deleteFrom("seasons")
        .where("start_year", "=", year)
        .execute();
      c.executionCtx.waitUntil(logAuditAction(c, "season_purged", "seasons", params.id, `Season "${params.id}" permanently deleted`));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Purge failed" } };
    }
  },
};
const seasonsTsRestRouter = s.router(seasonsContract, seasonsHandlers);
createHonoEndpoints(seasonsContract, seasonsTsRestRouter, seasonsRouter);

// Middlewares
seasonsRouter.use("/admin", ensureAdmin);
seasonsRouter.use("/admin/*", ensureAdmin);
seasonsRouter.use("/admin", rateLimitMiddleware(15, 60));

export default seasonsRouter;
