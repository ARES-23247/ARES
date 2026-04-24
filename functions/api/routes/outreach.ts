import { Hono } from "hono";
import { Kysely, sql } from "kysely";
import { DB } from "../../../src/schemas/database";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { outreachContract } from "../../../src/schemas/contracts/outreachContract";
import { AppEnv, ensureAdmin, logAuditAction, rateLimitMiddleware } from "../middleware";

const s = initServer<AppEnv>();
const outreachRouter = new Hono<AppEnv>();

// Helper to fetch volunteer events and format them as outreach logs
async function fetchVolunteerEvents(db: Kysely<DB>) {
  try {
    const results = await db.selectFrom("events")
      .select(["id", "title", "date_start as date", "location", "season_id"])
      .where("is_volunteer", "=", 1)
      .where("is_deleted", "=", 0)
      .where("status", "=", "published")
      .orderBy("date_start", "desc")
      .execute();
    
    return results.map((r) => ({
      ...r,
      students_count: 0,
      hours_logged: 0,
      reach_count: 0,
      description: "Volunteer Event (Synced)",
      is_dynamic: true
    }));
  } catch {
    return [];
  }
}

const outreachTsRestRouter = s.router(outreachContract, {
  list: async ({}: any, c: any) => {
    try {
      const db = c.get("db");
      const logs = await db.selectFrom("outreach_logs")
        .select([
          "id", "title", "date", "location", 
          "hours as hours_logged", "people_reached as reach_count", 
          "students_count", "impact_summary as description", "season_id"
        ])
        .where("is_deleted", "=", 0)
        .orderBy("date", "desc")
        .execute();
      
      const volunteerEvents = await fetchVolunteerEvents(db);
      const combined = [...logs, ...volunteerEvents].sort(
        (a, b) => new Date((b as { date: string }).date).getTime() - new Date((a as { date: string }).date).getTime()
      );

      return { status: 200, body: { logs: combined as unknown[] } };
    } catch {
      return { status: 500, body: { error: "Failed to fetch outreach logs" } };
    }
  },
  adminList: async ({}: any, c: any) => {
    try {
      const db = c.get("db");
      const logs = await db.selectFrom("outreach_logs")
        .select([
          "id", "title", "date", "location", 
          "hours as hours_logged", "people_reached as reach_count", 
          "students_count", "impact_summary as description", "season_id"
        ])
        .where("is_deleted", "=", 0)
        .orderBy("date", "desc")
        .execute();
      
      const volunteerEvents = await fetchVolunteerEvents(db);
      const combined = [...logs, ...volunteerEvents].sort(
        (a, b) => new Date((b as { date: string }).date).getTime() - new Date((a as { date: string }).date).getTime()
      );

      return { status: 200, body: { logs: combined as unknown[] } };
    } catch {
      return { status: 500, body: { error: "Failed to fetch outreach logs" } };
    }
  },
  save: async ({ body }: { body: any }, c: any) => {
    try {
      const db = c.get("db");
      if (body.id) {
        await db.updateTable("outreach_logs")
          .set({
            title: body.title,
            date: body.date,
            location: body.location,
            hours: body.hours_logged,
            people_reached: body.reach_count,
            students_count: body.students_count,
            impact_summary: body.description,
            season_id: body.season_id,
          })
          .where("id", "=", body.id)
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "update_outreach", "outreach_logs", body.id, `Updated outreach: ${body.title}`));
      } else {
        const id = crypto.randomUUID();
        await db.insertInto("outreach_logs")
          .values({
            id,
            title: body.title,
            date: body.date,
            location: body.location,
            hours: body.hours_logged,
            people_reached: body.reach_count,
            students_count: body.students_count,
            impact_summary: body.description,
            season_id: body.season_id,
          })
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "create_outreach", "outreach_logs", id, `Created outreach: ${body.title}`));
      }
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Save failed" } };
    }
  },
  delete: async ({ params }: { params: any }, c: any) => {
    try {
      const db = c.get("db");
      await db.updateTable("outreach_logs")
        .set({ is_deleted: 1 })
        .where("id", "=", params.id)
        .execute();
      c.executionCtx.waitUntil(logAuditAction(c, "delete_outreach", "outreach_logs", params.id, "Outreach log soft-deleted"));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Delete failed" } };
    }
  },
});

createHonoEndpoints(outreachContract, outreachTsRestRouter, outreachRouter);

// Middlewares
// Protections
outreachRouter.use("/admin", ensureAdmin);
outreachRouter.use("/admin/*", ensureAdmin);
outreachRouter.use("/admin", rateLimitMiddleware(15, 60));

export default outreachRouter;
