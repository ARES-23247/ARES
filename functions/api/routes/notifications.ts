/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { notificationContract } from "../../../src/schemas/contracts/notificationContract";
import { AppEnv, ensureAuth, getSessionUser, rateLimitMiddleware } from "../middleware";

const s = initServer<AppEnv>();
const notificationsRouter = new Hono<AppEnv>();

const notificationHandlers: any = {
  getNotifications: async (_: any, c: any) => {
    try {
      const db = c.get("db");
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const results = await db.selectFrom("notifications")
        .select(["id", "title", "message", "link", "priority", "is_read", "created_at"])
        .where("user_id", "=", user.id)
        .orderBy("created_at", "desc")
        .limit(50)
        .execute();

      return { status: 200, body: { notifications: results as unknown[] } };
    } catch {
      return { status: 500, body: { notifications: [] } };
    }
  },
  markAsRead: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db");
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      await db.updateTable("notifications")
        .set({ is_read: 1 })
        .where("id", "=", params.id)
        .where("user_id", "=", user.id)
        .execute();

      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Update failed" } };
    }
  },
  markAllAsRead: async (_: any, c: any) => {
    try {
      const db = c.get("db");
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      await db.updateTable("notifications")
        .set({ is_read: 1 })
        .where("user_id", "=", user.id)
        .execute();

      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Update failed" } };
    }
  },
};
const notificationTsRestRouter = s.router(notificationContract, notificationHandlers);
createHonoEndpoints(notificationContract, notificationTsRestRouter, notificationsRouter);

// Middlewares
notificationsRouter.use("*", ensureAuth);
notificationsRouter.use("/:id/read", rateLimitMiddleware(20, 60));
notificationsRouter.use("/read-all", rateLimitMiddleware(10, 60));

export default notificationsRouter;
