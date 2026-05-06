import { Hono } from "hono";
import { sql, Kysely } from "kysely";
import { createHonoEndpoints } from "ts-rest-hono";
import { sponsorContract } from "../../../shared/schemas/contracts/sponsorContract";
import { AppEnv, ensureAdmin, logAuditAction, rateLimitMiddleware, s } from "../middleware";
import { sendZulipAlert } from "../../utils/zulipSync";
import type { HonoContext } from "@shared/types/api";
import { DB } from "../../../shared/schemas/database";

export const sponsorsRouter = new Hono<AppEnv>();

type SponsorSelectedRow = {
  id: string | null;
  name: string;
  tier: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: number | null;
};

type HandlerInput = {
  params: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
};

const sponsorHandlers = {
  getSponsors: async (_input: HandlerInput, c: HonoContext) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const results = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .where("is_active", "=", 1)
        .orderBy(sql<number>`CASE tier WHEN 'Titanium' THEN 1 WHEN 'Gold' THEN 2 WHEN 'Silver' THEN 3 ELSE 4 END`)
        .execute();

      const sponsors = (results as SponsorSelectedRow[]).map((s) => ({
        ...s,
        id: s.id ?? "",
        is_active: s.is_active ? 1 : 0,
        tier: s.tier || "In-Kind"
      }));

      return { status: 200, body: { sponsors } };
    } catch (e) {
      console.error("[Sponsors:List] Error", e);
      return { status: 500, body: { error: "Failed to fetch sponsors" } };
    }
  },

  getRoi: async (input: HandlerInput, c: HonoContext) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const { token } = input.params;
      const tokens = await db.selectFrom("sponsor_tokens")
        .select("sponsor_id")
        .where("token", "=", token)
        .execute();

      if (!tokens || tokens.length === 0) return { status: 403, body: { error: "Invalid token" } };
      const sponsor_id = tokens[0].sponsor_id;

      const sponsorRow = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .where("id", "=", sponsor_id)
        .executeTakeFirst();

      if (!sponsorRow) return { status: 403, body: { error: "Sponsor not found" } };

      const metricsRow = await db.selectFrom("sponsor_metrics")
        .select(["id", "sponsor_id", "clicks", "impressions", "year_month"])
        .where("sponsor_id", "=", sponsor_id)
        .orderBy("created_at", "asc")
        .execute();

      const sponsor = {
        ...sponsorRow,
        id: sponsorRow.id ?? "",
        is_active: sponsorRow.is_active ? 1 : 0,
        tier: sponsorRow.tier || "In-Kind"
      };

      const metrics = metricsRow.map((m) => ({
        id: m.id ?? "",
        sponsor_id: m.sponsor_id,
        clicks: m.clicks ?? 0,
        impressions: m.impressions ?? 0,
        year_month: m.year_month
      }));

      return { status: 200, body: { sponsor, metrics } };
    } catch (e) {
      console.error("[Sponsors:Roi] Error", e);
      return { status: 500, body: { error: "Failed to fetch ROI" } };
    }
  },

  adminList: async (_input: HandlerInput, c: HonoContext) => {
    try {
      await ensureAdmin(c, async () => {});
      const db = c.get("db") as Kysely<DB>;
      const sponsors = await db.selectFrom("sponsors").selectAll().execute();
      
      return { 
        status: 200, 
        body: { 
          sponsors: sponsors.map(s => ({
            ...s,
            logo_url: s.logo_url || null,
            website_url: s.website_url || null,
            is_active: s.is_active ? 1 : 0
          })) 
        } 
      };
    } catch (e) {
      console.error("[Sponsors:AdminList] Error", e);
      return { status: 500, body: { error: "Admin access required" } };
    }
  },

  saveSponsor: async (input: HandlerInput, c: HonoContext) => {
    try {
      await ensureAdmin(c, async () => {});
      const db = c.get("db") as Kysely<DB>;
      const body = input.body as any; // Safe cast for body properties
      const id = body.id || crypto.randomUUID();
      
      if (body.id) {
        await db.updateTable("sponsors")
          .set({
            name: body.name,
            tier: body.tier,
            logo_url: body.logo_url || null,
            website_url: body.website_url || null,
            is_active: body.is_active ? 1 : 0,
          })
          .where("id", "=", body.id)
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "update_sponsor", "sponsors", id));
      } else {
        await db.insertInto("sponsors")
          .values({
            id,
            name: body.name,
            tier: body.tier,
            logo_url: body.logo_url || null,
            website_url: body.website_url || null,
            is_active: body.is_active ? 1 : 0,
          })
          .execute();
        c.executionCtx.waitUntil(logAuditAction(c, "create_sponsor", "sponsors", id, `Created sponsor ${body.name}`));
      }

      return { status: 200, body: { success: true, id } };
    } catch (e) {
      console.error("[Sponsors:Save] Error", e);
      return { status: 500, body: { error: "Failed to save sponsor" } };
    }
  },

  deleteSponsor: async (input: HandlerInput, c: HonoContext) => {
    try {
      await ensureAdmin(c, async () => {});
      const db = c.get("db") as Kysely<DB>;
      const { id } = input.params;

      await db.deleteFrom("sponsors").where("id", "=", id).execute();
      c.executionCtx.waitUntil(logAuditAction(c, "delete_sponsor", "sponsors", id));
      return { status: 200, body: { success: true } };
    } catch (e) {
      console.error("[Sponsors:Delete] Error", e);
      return { status: 500, body: { error: "Failed to delete sponsor" } };
    }
  },

  getAdminTokens: async (_input: HandlerInput, c: HonoContext) => {
    try {
      await ensureAdmin(c, async () => {});
      const db = c.get("db") as Kysely<DB>;
      const results = await db.selectFrom("sponsor_tokens as t")
        .innerJoin("sponsors as s", "t.sponsor_id", "s.id")
        .select(["t.token", "t.sponsor_id", "t.created_at"])
        .orderBy("t.created_at", "desc")
        .execute();

      const tokens = results.map((t) => ({
        token: t.token ?? "",
        sponsor_id: t.sponsor_id,
        created_at: t.created_at ?? "",
        last_used: null
      }));

      return { status: 200, body: { tokens } };
    } catch (e) {
      console.error("[Sponsors:Tokens] Error", e);
      return { status: 500, body: { error: "Failed to fetch tokens" } };
    }
  },

  generateToken: async (input: HandlerInput, c: HonoContext) => {
    try {
      await ensureAdmin(c, async () => {});
      const db = c.get("db") as Kysely<DB>;
      const { sponsor_id } = input.body as { sponsor_id: string };

      const token = crypto.randomUUID();
      await db.insertInto("sponsor_tokens").values({ token, sponsor_id }).execute();

      c.executionCtx.waitUntil(logAuditAction(c, "generate_token", "sponsor_tokens", sponsor_id));
      
      const sRes = await db.selectFrom("sponsors").select("name").where("id", "=", sponsor_id).executeTakeFirst();
      if (sRes) await sendZulipAlert(c.env, "Sponsor", "ROI Token Generated", `ROI token for **${sRes.name}**.`);

      return { status: 200, body: { success: true, token } };
    } catch (error) {
      console.error("[Sponsors:GenerateToken] Error:", error);
      return { status: 500, body: { error: "Failed to generate token" } };
    }
  },
};

const sponsorTsRestRouter = s.router(sponsorContract, sponsorHandlers as any);

// WR-12: Add rate limiting to public sponsor endpoint to prevent scraping
sponsorsRouter.use("*", rateLimitMiddleware(15, 60));

// WR-01 FIX: Standardize on /admin/* pattern (remove redundant /admin patterns)
sponsorsRouter.use("/admin/*", ensureAdmin);

createHonoEndpoints(
  sponsorContract,
  sponsorTsRestRouter,
  sponsorsRouter,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, _c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);

export default sponsorsRouter;