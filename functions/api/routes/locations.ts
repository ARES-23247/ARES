import { Hono } from "hono";
import { Kysely } from "kysely";
import { DB } from "../../../src/schemas/database";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { locationContract } from "../../../src/schemas/contracts/locationContract";
import { AppEnv, ensureAdmin, logAuditAction } from "../middleware";

const s = initServer<AppEnv>();
const locationsRouter = new Hono<AppEnv>();

const locationsTsRestRouter = s.router(locationContract, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: async (_: any, c: any) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const results = await db.selectFrom("locations")
        .select(["id", "name", "address", "maps_url", "is_deleted"])
        .where("is_deleted", "=", 0)
        .orderBy("name", "asc")
        .execute();
      return { status: 200, body: { locations: results as unknown[] } };
    } catch {
      return { status: 500, body: { error: "Failed to fetch locations" } };
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminList: async (_: any, c: any) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const results = await db.selectFrom("locations")
        .selectAll()
        .orderBy("name", "asc")
        .execute();
      return { status: 200, body: { locations: results as unknown[] } };
    } catch {
      return { status: 500, body: { error: "Failed to fetch locations" } };
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  save: async ({ body }: any, c: any) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      if (body.id) {
        await db.updateTable("locations")
          .set({
            name: body.name,
            address: body.address,
            maps_url: body.maps_url,
            is_deleted: body.is_deleted ?? 0,
          })
          .where("id", "=", body.id)
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "update_location", "locations", body.id, `Updated location: ${body.name}`));
      } else {
        const id = crypto.randomUUID();
        await db.insertInto("locations")
          .values({
            id,
            name: body.name,
            address: body.address,
            maps_url: body.maps_url,
            is_deleted: 0,
          })
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "create_location", "locations", id, `Created location: ${body.name}`));
      }
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Save failed" } };
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      await db.updateTable("locations")
        .set({ is_deleted: 1 })
        .where("id", "=", params.id)
        .execute();
      c.executionCtx.waitUntil(logAuditAction(c, "delete_location", "locations", params.id, "Location soft-deleted"));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Delete failed" } };
    }
  },
});

createHonoEndpoints(locationContract, locationsTsRestRouter, locationsRouter);

// Middlewares
locationsRouter.use("/admin/*", ensureAdmin);
locationsRouter.use("/admin", (c, next) => next()); // rate limiting if needed

export default locationsRouter;
