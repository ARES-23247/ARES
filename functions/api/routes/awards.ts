import { Hono } from "hono";
import { Kysely } from "kysely";
import { DB } from "../../../src/schemas/database";
import { AppEnv, ensureAdmin, logAuditAction } from "../middleware";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { awardContract } from "../../../src/schemas/contracts/awardContract";

const awardsRouter = new Hono<AppEnv>();
const s = initServer<AppEnv>();

const awardTsRestRouter = s.router(awardContract, {
  getAwards: async ({ query }, c) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const { limit = 50, offset = 0 } = query;
      const results = await db.selectFrom("awards")
        .select(["id", "title", "date", "event_name", "description", "icon_type as image_url", "season_id", "created_at"])
        .where("is_deleted", "=", 0)
        .orderBy("date", "desc")
        .orderBy("title", "asc")
        .limit(limit)
        .offset(offset)
        .execute();
      
      const awards = results.map(a => ({
        id: String(a.id),
        title: a.title,
        year: Number(a.date),
        event_name: a.event_name || null,
        description: a.description || null,
        image_url: a.image_url || "trophy",
        season_id: a.season_id ? Number(a.season_id) : null,
        created_at: a.created_at || new Date().toISOString(),
        updated_at: a.created_at || new Date().toISOString() // Fallback if missing
      }));

      return { status: 200, body: { awards } };
    } catch (err) {
      console.error("[Awards] getAwards failed:", err);
      return { status: 200, body: { awards: [] } };
    }
  },
  saveAward: async ({ body }, c) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const { id, title, year, event_name, description, image_url, season_id } = body;

      let finalId = id;
      let exists = false;
      if (id) {
        const row = await db.selectFrom("awards").select("id").where("id", "=", id).executeTakeFirst();
        if (row) exists = true;
      } else {
        finalId = crypto.randomUUID();
      }

      const values = {
        title,
        date: String(year),
        event_name: event_name || "",
        description: description || null,
        icon_type: image_url || "trophy",
        season_id: season_id || null,
        is_deleted: 0
      } as const;

      if (exists && finalId) {
        await db.updateTable("awards").set(values).where("id", "=", finalId).execute();
        c.executionCtx.waitUntil(logAuditAction(c, "award_updated", "awards", finalId, `Award "${title}" (${year}) updated`));
      } else if (finalId) {
        await db.insertInto("awards").values({ ...values, id: Number(finalId) as any }).execute(); // SQLite PK handling
        c.executionCtx.waitUntil(logAuditAction(c, "award_created", "awards", finalId, `Award "${title}" (${year}) created`));
      }

      return { status: 200, body: { success: true, id: finalId } };
    } catch (err) {
      console.error("[Awards] saveAward failed:", err);
      return { status: 200, body: { success: false } };
    }
  },
  deleteAward: async ({ params }, c) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      await db.updateTable("awards").set({ is_deleted: 1 }).where("id", "=", Number(params.id) as any).execute();
      c.executionCtx.waitUntil(logAuditAction(c, "award_deleted", "awards", params.id, "Award soft-deleted"));
      return { status: 200, body: { success: true } };
    } catch (err) {
      console.error("[Awards] deleteAward failed:", err);
      return { status: 200, body: { success: false } };
    }
  },
});

createHonoEndpoints(awardContract, awardTsRestRouter, awardsRouter);

// Protections
awardsRouter.use("/admin", ensureAdmin);
awardsRouter.use("/admin/*", ensureAdmin);

export default awardsRouter;