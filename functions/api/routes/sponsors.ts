/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { sponsorContract } from "../../../src/schemas/contracts/sponsorContract";
import { AppEnv, ensureAdmin, logAuditAction, rateLimitMiddleware } from "../middleware";
import { sql } from "kysely";
import { sendZulipAlert } from "../../utils/zulipSync";

const s = initServer<AppEnv>();
const sponsorsRouter = new Hono<AppEnv>();

const sponsorHandlers: any = {
  getSponsors: async (_: any, c: any) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .where("is_active", "=", 1)
        .orderBy(sql<number>`CASE tier WHEN 'Titanium' THEN 1 WHEN 'Gold' THEN 2 WHEN 'Silver' THEN 3 ELSE 4 END`)
        .execute();
      return { status: 200, body: { sponsors: results } };
    } catch {
      return { status: 200, body: { sponsors: [] } };
    }
  },
  getRoi: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db");
      const { token } = params;
      const tokens = await db.selectFrom("sponsor_tokens")
        .select("sponsor_id")
        .where("token", "=", token)
        .execute();

      if (!tokens || tokens.length === 0) return { status: 403, body: { error: "Invalid token" } };
      const sponsor_id = tokens[0].sponsor_id;

      const sponsor = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url"])
        .where("id", "=", sponsor_id)
        .executeTakeFirst();

      const metrics = await db.selectFrom("sponsor_metrics")
        .select(["year_month", "impressions", "clicks"])
        .where("sponsor_id", "=", sponsor_id)
        .orderBy("year_month", "asc")
        .execute();

      return { status: 200, body: { sponsor: sponsor as unknown, metrics: metrics as unknown[] } };
    } catch {
      return { status: 500, body: { error: "Failed to fetch ROI" } };
    }
  },
  adminList: async (_: any, c: any) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .orderBy("created_at", "desc")
        .execute();
      return { status: 200, body: { sponsors: results as unknown[] } };
    } catch {
      return { status: 200, body: { sponsors: [] } };
    }
  },
  saveSponsor: async ({ body }: any, c: any) => {
    try {
      const db = c.get("db");
      const { id, name, tier, logo_url, website_url, is_active } = body;
      const finalId = id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      await db.insertInto("sponsors")
        .values({ id: finalId, name, tier, logo_url: logo_url || null, website_url: website_url || null, is_active: is_active ?? 1 })
        .onConflict((oc: any) => oc.column('id').doUpdateSet({ name, tier, logo_url: logo_url || null, website_url: website_url || null, is_active: is_active ?? 1 }))
        .execute();

      c.executionCtx.waitUntil(logAuditAction(c, "SAVE_SPONSOR", "sponsors", finalId, `Saved sponsor: ${name}`));
      return { status: 200, body: { success: true, id: finalId } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  deleteSponsor: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db");
      await db.updateTable("sponsors").set({ is_active: 0 }).where("id", "=", params.id).execute();
      c.executionCtx.waitUntil(logAuditAction(c, "DEACTIVATE_SPONSOR", "sponsors", params.id, `Deactivated sponsor ${params.id}`));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  getAdminTokens: async (_: any, c: any) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("sponsor_tokens as t")
        .innerJoin("sponsors as s", "t.sponsor_id", "s.id")
        .select(["t.token", "t.sponsor_id", "s.name as sponsor_name", "t.created_at"])
        .orderBy("t.created_at", "desc")
        .execute();
      return { status: 200, body: { tokens: results as unknown[] } };
    } catch {
      return { status: 500, body: { tokens: [] } };
    }
  },
  generateToken: async ({ body }: any, c: any) => {
    try {
      const db = c.get("db");
      const { sponsor_id } = body;
      const token = crypto.randomUUID();
      await db.insertInto("sponsor_tokens").values({ token, sponsor_id }).execute();

      c.executionCtx.waitUntil(logAuditAction(c, "GENERATE_TOKEN", "sponsor_tokens", token, `Generated token for ${sponsor_id}`));
      
      c.executionCtx.waitUntil((async () => {
        const sRes = await db.selectFrom("sponsors").select("name").where("id", "=", sponsor_id).executeTakeFirst();
        if (sRes) await sendZulipAlert(c.env, "Sponsor", "ROI Token Generated", `ROI token for **${sRes.name}**.`);
      })());

      return { status: 200, body: { success: true, token } };
    } catch {
      return { status: 500, body: { error: "Failed to generate" } };
    }
  },
};

const sponsorTsRestRouter = s.router(sponsorContract, sponsorHandlers);
createHonoEndpoints(sponsorContract, sponsorTsRestRouter, sponsorsRouter);

// Protections
sponsorsRouter.use("/admin", ensureAdmin);
sponsorsRouter.use("/admin/*", ensureAdmin);
sponsorsRouter.use("/admin", rateLimitMiddleware(15, 60));

export default sponsorsRouter;
