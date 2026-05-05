 
import { Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { eventContract } from "../../../../shared/schemas/contracts/eventContract";
import { AppEnv, ensureAdmin, ensureAuth } from "../../middleware";
import { eventHandlers } from "./handlers";
import { Kysely } from "kysely";
import { DB } from "../../../../shared/schemas/database";

const s = initServer<AppEnv>();
const eventsRouter = new Hono<AppEnv>();

const eventTsRestRouter = s.router(eventContract, eventHandlers);

import { edgeCacheMiddleware } from "../../middleware/cache";

// Apply protections
eventsRouter.use("/", edgeCacheMiddleware(300, 60)); // Cache list
eventsRouter.use("/:id", edgeCacheMiddleware(300, 60)); // Cache single
eventsRouter.use("/admin", ensureAdmin);
eventsRouter.use("/admin/*", ensureAdmin);
eventsRouter.use("/:id/signups", ensureAuth);

// ── Event Version History (plain Hono routes) ────────────────────────
eventsRouter.get("/admin/:id/history", async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.get("db") as Kysely<DB>;
    const results = await db.selectFrom("document_history")
      .select(["id", "room_id", "content", "created_by", "created_at"])
      .where("room_id", "=", `event_${id}`)
      .orderBy("created_at", "desc")
      .limit(50)
      .execute();

    const history = results.map(h => ({
      id: Number(h.id),
      title: `Revision ${h.id}`,
      author_email: h.created_by,
      created_at: h.created_at,
    }));

    return c.json({ history });
  } catch (e) {
    console.error("[Events:History] Error", e);
    return c.json({ error: "Failed to fetch history" }, 500);
  }
});

eventsRouter.patch("/admin/:id/history/:historyId/restore", async (c) => {
  try {
    const id = c.req.param("id");
    const historyId = c.req.param("historyId");
    const db = c.get("db") as Kysely<DB>;

    const row = await db.selectFrom("document_history")
      .select(["content"])
      .where("id", "=", Number(historyId) as any)
      .where("room_id", "=", `event_${id}`)
      .executeTakeFirst();

    if (!row) {
      return c.json({ error: "Version not found" }, 404);
    }

    // Update the event description with the restored content
    await db.updateTable("events")
      .set({ description: row.content })
      .where("id", "=", id)
      .execute();

    // Save a new history entry for the restore action
    const { getSessionUser } = await import("../../middleware");
    const user = await getSessionUser(c);
    await db.insertInto("document_history")
      .values({
        room_id: `event_${id}`,
        content: row.content,
        created_by: user?.email || "admin",
        created_at: new Date().toISOString(),
      })
      .execute();

    return c.json({ success: true });
  } catch (e) {
    console.error("[Events:RestoreHistory] Error", e);
    return c.json({ error: "Restore failed" }, 500);
  }
});

createHonoEndpoints(
  eventContract,
  eventTsRestRouter,
  eventsRouter,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, _c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);

export default eventsRouter;
