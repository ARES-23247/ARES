import { Hono } from "hono";
import { Context } from "hono";
import { Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";
import { AppEnv, ensureAdmin, logAuditAction } from "../middleware";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { awardContract } from "../../../shared/schemas/contracts/awardContract";

const s = initServer<AppEnv>();
export const awardsRouter = new Hono<AppEnv>();

const awardsTsRestRouter: any = s.router(awardContract as any, {
    getAwards: async ({ query }: { query: any }, c: Context<AppEnv>) => {
    try {
                  const db = c.get("db") as Kysely<DB>;
      const { limit = 50, offset = 0 } = query;
      const results = await db.selectFrom("awards")
        .select(["id", "title", "date", "event_name", "description", "icon_type as image_url", "season_id", "created_at"])
        .where("is_deleted", "=", 0)
        .orderBy("date", "desc")
        .orderBy("title", "asc")
        .limit(limit || 50)
        .offset(offset || 0)
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
        updated_at: a.created_at || new Date().toISOString()
      }));

      return { status: 200 as const, body: { awards } };
    } catch (e) {
      console.error("GET_AWARDS ERROR", e);
      return { status: 500 as const, body: { error: "Failed to fetch awards" } as any };
    }
  },
    saveAward: async ({ body }: { body: any }, c: Context<AppEnv>) => {
    try {
                  const db = c.get("db") as Kysely<DB>;
      const { id, title, year, event_name, description, image_url, season_id } = body;

      let finalId: string | undefined = id;
      let exists = false;
      if (id) {
        const row = await db.selectFrom("awards").select("id").where("id", "=", Number(id) as any).executeTakeFirst();
        if (row) {
          exists = true;
          finalId = String(row.id);
        }
      }

      // CR-06 FIX: Reduce race condition window by checking duplicates immediately before insert
      // Note: Full atomic upsert requires database unique constraint on (title, date, event_name)
      if (!exists) {
        const duplicate = await db.selectFrom("awards")
          .select("id")
          .where("title", "=", title)
          .where("date", "=", String(year))
          .where("event_name", "=", event_name || "")
          .where("is_deleted", "=", 0)
          .executeTakeFirst();
        if (duplicate) {
          exists = true;
          finalId = String(duplicate.id);
        }
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
        await db.updateTable("awards").set(values).where("id", "=", Number(finalId) as any).execute();
        c.executionCtx.waitUntil(logAuditAction(c, "award_updated", "awards", finalId, `Award "${title}" (${year}) updated`));
      } else {
        // Attempt insert with duplicate handling for race condition
        try {
          const res = await db.insertInto("awards").values({ ...values, id: undefined }).executeTakeFirst();
          const newId = res && "insertId" in res ? String(res.insertId) : "new";
          c.executionCtx.waitUntil(logAuditAction(c, "award_created", "awards", newId, `Award "${title}" (${year}) created`));
          finalId = newId;
        } catch (insertError: any) {
          // Check if this is a duplicate constraint violation (race condition)
          if (insertError?.message?.includes('UNIQUE') || insertError?.message?.includes('constraint')) {
            // Retry by fetching the duplicate that was just created
            const duplicate = await db.selectFrom("awards")
              .select("id")
              .where("title", "=", title)
              .where("date", "=", String(year))
              .where("event_name", "=", event_name || "")
              .where("is_deleted", "=", 0)
              .executeTakeFirst();
            if (duplicate) {
              finalId = String(duplicate.id);
              c.executionCtx.waitUntil(logAuditAction(c, "award_race_condition_handled", "awards", finalId, `Award "${title}" (${year}) race condition - returned existing record`));
            } else {
              throw insertError;
            }
          } else {
            throw insertError;
          }
        }
      }

      return { status: 200 as const, body: { success: true, id: finalId! } };
    } catch (e) {
      console.error("SAVE_AWARD ERROR", e);
      return { status: 500 as const, body: { error: "Failed to save award", success: false } as any };
    }
  },
    deleteAward: async ({ params, body: _body }: { params: any, body: any }, c: Context<AppEnv>) => {

    try {
                  const db = c.get("db") as Kysely<DB>;
      await db.updateTable("awards").set({ is_deleted: 1 }).where("id", "=", Number(params.id) as any).execute();
      c.executionCtx.waitUntil(logAuditAction(c, "award_deleted", "awards", params.id, "Award soft-deleted"));
      return { status: 200 as const, body: { success: true } };
    } catch (e) {
      console.error("DELETE_AWARD ERROR", e);
      return { status: 500 as const, body: { error: "Failed to delete award", success: false } as any };
    }
  },
} as any);

awardsRouter.use("/admin/*", ensureAdmin);
createHonoEndpoints(awardContract, awardsTsRestRouter, awardsRouter);

export default awardsRouter;
