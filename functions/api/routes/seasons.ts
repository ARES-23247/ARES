import { Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { Context } from "hono";
import { seasonContract } from "../../../shared/schemas/contracts/seasonContract";
import { AppEnv, ensureAdmin, logAuditAction, rateLimitMiddleware } from "../middleware";
import { Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";

const s = initServer<AppEnv>();

const seasonsTsRestRouter = s.router(seasonContract, {
  list: async (_input, c: Context<AppEnv>) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const results = await db.selectFrom("seasons")
        .select(["start_year", "end_year", "challenge_name", "robot_name", "robot_image", "robot_description", "robot_cad_url", "summary", "album_url", "album_cover", "status", "is_deleted"])
        .where("is_deleted", "=", 0)
        .where("status", "=", "published")
        .orderBy("start_year", "desc")
        .execute();
      
      const seasons = results.map(r => ({
        ...r,
        start_year: Number(r.start_year),
        end_year: Number(r.end_year || Number(r.start_year) + 1),
        is_deleted: Number(r.is_deleted || 0),
        status: r.status as "published" | "draft"
      }));

      return { status: 200, body: { seasons } };
    } catch (e) {
      console.error("[Seasons:List] Error", e);
      return { status: 500, body: { error: "Failed to fetch seasons" } };
    }
  },
  adminList: async (_input, c: Context<AppEnv>) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const results = await db.selectFrom("seasons")
        .select(["start_year", "end_year", "challenge_name", "robot_name", "robot_image", "robot_description", "robot_cad_url", "summary", "album_url", "album_cover", "status", "is_deleted"])
        .orderBy("start_year", "desc")
        .execute();

      const seasons = results.map(r => ({
        ...r,
        start_year: Number(r.start_year),
        end_year: Number(r.end_year || Number(r.start_year) + 1),
        is_deleted: Number(r.is_deleted || 0),
        status: r.status as "published" | "draft"
      }));

      return { status: 200, body: { seasons } };
    } catch (e) {
      console.error("[Seasons:AdminList] Error", e);
      return { status: 500, body: { error: "Failed to list seasons" } };
    }
  },
  adminDetail: async (input, c: Context<AppEnv>) => {
    try {
      const { params } = input;
      const db = c.get("db") as Kysely<DB>;
      const year = parseInt(params.id);
      const row = await db.selectFrom("seasons")
        .select(["start_year", "end_year", "challenge_name", "robot_name", "robot_image", "robot_description", "robot_cad_url", "summary", "album_url", "album_cover", "status", "is_deleted"])
        .where("start_year", "=", year)
        .executeTakeFirst();

      if (!row) return { status: 404, body: { error: "Season not found" } };
      
      return { 
        status: 200, 
        body: { 
          season: {
            ...row,
            start_year: Number(row.start_year),
            end_year: Number(row.end_year || Number(row.start_year) + 1),
            is_deleted: Number(row.is_deleted || 0),
            status: row.status as "published" | "draft"
          }
        }
      };
    } catch (e) {
      console.error("[Seasons:AdminDetail] Error", e);
      return { status: 500, body: { error: "Failed to fetch season" } };
    }
  },
  getDetail: async (input, c: Context<AppEnv>) => {
    try {
      const { params } = input;
      const db = c.get("db") as Kysely<DB>;
      const year = parseInt(params.year);
      if (isNaN(year)) return { status: 404, body: { error: "Invalid year" } };

      const [seasonRow, awards, events, posts, outreach] = await Promise.all([
        db.selectFrom("seasons").select(["start_year", "end_year", "challenge_name", "robot_name", "robot_image", "robot_description", "robot_cad_url", "summary", "album_url", "album_cover", "status", "is_deleted"]).where("start_year", "=", year).executeTakeFirst(),
        db.selectFrom("awards").select(["id", "title", "event_name", "date", "season_id", "is_deleted"]).where("season_id", "=", Number(year) as any).execute(),
        db.selectFrom("events").select(["id", "title", "category", "date_start", "date_end", "location", "cover_image", "status", "is_deleted", "season_id"]).where("season_id", "=", Number(year) as any).where("is_deleted", "=", 0).execute(),
        db.selectFrom("posts").select(["slug", "title", "snippet", "thumbnail", "status", "is_deleted", "season_id", "date"]).where("season_id", "=", Number(year) as any).where("is_deleted", "=", 0).execute(),
        db.selectFrom("outreach_logs").select(["id", "title", "date", "location", "hours", "students_count", "people_reached", "impact_summary", "season_id", "is_deleted"]).where("season_id", "=", Number(year) as any).execute(),
      ]);

      if (!seasonRow) return { status: 404, body: { error: "Season not found" } };

      return {
        status: 200,
        body: {
          season: {
            ...seasonRow,
            start_year: Number(seasonRow.start_year),
            end_year: Number(seasonRow.end_year || Number(seasonRow.start_year) + 1),
            is_deleted: Number(seasonRow.is_deleted || 0),
            status: seasonRow.status as "published" | "draft"
          },
          awards: awards as any[],
          events: events as any[],
          posts: posts as any[],
          outreach: outreach as any[],
        }
      };
    } catch (e) {
      console.error("[Seasons:Detail] Error", e);
      return { status: 500, body: { error: "Failed to fetch season details" } };
    }
  },
  save: async (input, c: Context<AppEnv>) => {
    try {
      const { body } = input;
      const db = c.get("db") as Kysely<DB>;
      const targetYear = body.original_year || body.start_year;

      if (body.original_year && body.original_year !== body.start_year) {
        const collision = await db.selectFrom("seasons").select("start_year").where("start_year", "=", body.start_year).executeTakeFirst();
        if (collision) {
          // Note: Contract says 400 for errors, but might need to allow 409 later. For now, 500 or 400.
          return { status: 500, body: { error: `Season ${body.start_year} already exists.` } };
        }
      }

      const existing = await db.selectFrom("seasons")
        .select("start_year")
        .where("start_year", "=", targetYear)
        .executeTakeFirst();

      const values = {
        start_year: body.start_year,
        end_year: body.end_year,
        challenge_name: body.challenge_name,
        robot_name: body.robot_name || null,
        robot_image: body.robot_image || null,
        robot_description: body.robot_description || null,
        robot_cad_url: body.robot_cad_url || null,
        summary: body.summary || null,
        album_url: body.album_url || null,
        album_cover: body.album_cover || null,
        status: body.status || "draft",
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await db.updateTable("seasons")
          .set(values)
          .where("start_year", "=", targetYear)
          .execute();

        if (body.original_year && body.original_year !== body.start_year) {
          const oldId = targetYear.toString();
          const newId = body.start_year.toString();
          await db.updateTable("events").set({ season_id: newId }).where("season_id", "=", oldId).execute();
          await db.updateTable("posts").set({ season_id: newId }).where("season_id", "=", oldId).execute();
          await db.updateTable("awards").set({ season_id: newId }).where("season_id", "=", oldId).execute();
          await db.updateTable("outreach_logs").set({ season_id: newId }).where("season_id", "=", oldId).execute();
          
          c.executionCtx.waitUntil(logAuditAction(c, "season_year_updated", "seasons", body.start_year.toString(), `Season ID changed from ${targetYear} to ${body.start_year}`));
        } else {
          c.executionCtx.waitUntil(logAuditAction(c, "season_updated", "seasons", body.start_year.toString(), `Season "${body.start_year}" updated`));
        }
      } else {
        await db.insertInto("seasons")
          .values({ ...values, is_deleted: 0 })
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "season_created", "seasons", body.start_year.toString(), `Season "${body.start_year}" created`));
      }
      return { status: 200, body: { success: true } };
    } catch (e) {
      console.error("[Seasons:Save] Error", e);
      return { status: 500, body: { error: "Save failed" } };
    }
  },
  delete: async (input, c: Context<AppEnv>) => {
    try {
      const { params } = input;
      const db = c.get("db") as Kysely<DB>;
      const year = parseInt(params.id);
      await db.updateTable("seasons")
        .set({ is_deleted: 1 })
        .where("start_year", "=", year)
        .execute();
      c.executionCtx.waitUntil(logAuditAction(c, "season_deleted", "seasons", params.id, `Season "${params.id}" soft-deleted`));
      return { status: 200, body: { success: true } };
    } catch (e) {
      console.error("[Seasons:Delete] Error", e);
      return { status: 500, body: { error: "Delete failed" } };
    }
  },
  undelete: async (input, c: Context<AppEnv>) => {
    try {
      const { params } = input;
      const db = c.get("db") as Kysely<DB>;
      const year = parseInt(params.id);
      await db.updateTable("seasons")
        .set({ is_deleted: 0 })
        .where("start_year", "=", year)
        .execute();
      c.executionCtx.waitUntil(logAuditAction(c, "season_restored", "seasons", params.id, `Season "${params.id}" restored`));
      return { status: 200, body: { success: true } };
    } catch (e) {
      console.error("[Seasons:Undelete] Error", e);
      return { status: 500, body: { error: "Restore failed" } };
    }
  },
  purge: async (input, c: Context<AppEnv>) => {
    try {
      const { params } = input;
      const db = c.get("db") as Kysely<DB>;
      const year = parseInt(params.id);
      await db.deleteFrom("seasons")
        .where("start_year", "=", year)
        .execute();
      c.executionCtx.waitUntil(logAuditAction(c, "season_purged", "seasons", params.id, `Season "${params.id}" permanently deleted`));
      return { status: 200, body: { success: true } };
    } catch (e) {
      console.error("[Seasons:Purge] Error", e);
      return { status: 500, body: { error: "Purge failed" } };
    }
  },
});

export const seasonsRouter = new Hono<AppEnv>();

seasonsRouter.use("/admin", ensureAdmin);
seasonsRouter.use("/admin/*", ensureAdmin);
seasonsRouter.use("/admin", rateLimitMiddleware(15, 60));

createHonoEndpoints(seasonContract, seasonsTsRestRouter, seasonsRouter);

export default seasonsRouter;
