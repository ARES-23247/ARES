import { Hono } from "hono";
import { sql } from "kysely";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { sponsorContract } from "../../../shared/schemas/contracts/sponsorContract";
import { AppEnv, ensureAdmin, logAuditAction, rateLimitMiddleware } from "../middleware";
import { sendZulipAlert } from "../../utils/zulipSync";

import type { HonoContext } from "@shared/types/api";


const s = initServer<AppEnv>();
export const sponsorsRouter = new Hono<AppEnv>();



type SponsorSelectedRow = {
  id: string | null;
  name: string;
  tier: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: number | null;
};

type SponsorMetricsResult = {
  id: string;
  sponsor_id: string;
  clicks: number;
  impressions: number;
  year_month: string;
};

type SponsorTokenResult = {
  token: string;
  sponsor_id: string;
  created_at: string;
  last_used: null;
};

const sponsorHandlers = {
  getSponsors: async (_input, c: HonoContext) => {
            try {
      const db = c.get("db");
      const results = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .where("is_active", "=", 1)
        .orderBy(sql<number>`CASE tier WHEN 'Titanium' THEN 1 WHEN 'Gold' THEN 2 WHEN 'Silver' THEN 3 ELSE 4 END`)
        .execute();

            const sponsors = results.map((s: SponsorSelectedRow) => ({
        ...s,
        id: s.id ?? "",
        is_active: s.is_active ? 1 : 0,
        tier: s.tier || "In-Kind"
      }));

      return { status: 200 as const, body: { sponsors } };
    } catch (e) {
      console.error("[Sponsors:List] Error", e);
      return { status: 500 as const, body: { error: "Failed to fetch sponsors" } };
    }
  },
  getRoi: async (input, c: HonoContext) => {
    try {
      const db = c.get("db");
      const { token } = input.params;
      const tokens = await db.selectFrom("sponsor_tokens")
        .select("sponsor_id")
        .where("token", "=", token)
        .execute();

      if (!tokens || tokens.length === 0) return { status: 403 as const, body: { error: "Invalid token" } };
      const sponsor_id = tokens[0].sponsor_id;

      const sponsorRow = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .where("id", "=", sponsor_id)
        .executeTakeFirst();

      if (!sponsorRow) return { status: 403 as const, body: { error: "Sponsor not found" } };

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
      })) as SponsorMetricsResult[];

      return { status: 200 as const, body: { sponsor, metrics } };
    } catch (e) {
      console.error("[Sponsors:ROI] Error", e);
      return { status: 500 as const, body: { error: "Failed to fetch ROI" } };
    }
  },
  adminList: async (_input, c: HonoContext) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .where("is_active", "=", 1)
        .orderBy("created_at", "desc")
        .execute();
      
            const sponsors = results.map((s: SponsorSelectedRow) => ({
        ...s,
        id: s.id ?? "",
        is_active: s.is_active ? 1 : 0,
        tier: s.tier || "In-Kind"
      }));

      return { status: 200 as const, body: { sponsors } };
    } catch (e) {
      console.error("[Sponsors:AdminList] Error", e);
      return { status: 500 as const, body: { error: "Failed to fetch sponsors" } };
    }
  },
  saveSponsor: async (input, c: HonoContext) => {
    try {
      const db = c.get("db");
      const { id, name, tier, logo_url, website_url, is_active } = input.body;

      if (!name) {
        return { status: 400 as const, body: { error: "name is required" } };
      }

      const finalId = id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      await db.insertInto("sponsors")
        .values({
          id: finalId,
          name,
          tier: tier ?? "",
          logo_url: logo_url ?? null,
          website_url: website_url ?? null,
          is_active: is_active ? 1 : 0
        })
                .onConflict((oc) => oc.column('id').doUpdateSet({
          name,
          tier: tier ?? "",
          logo_url: logo_url ?? null,
          website_url: website_url ?? null,
          is_active: is_active ? 1 : 0
        }))
        .execute();

      c.executionCtx.waitUntil(logAuditAction(c, "SAVE_SPONSOR", "sponsors", finalId, `Saved sponsor: ${name}`));
      return { status: 200 as const, body: { success: true, id: finalId } };
    } catch (e) {
      console.error("[Sponsors:Save] Error", e);
      return { status: 500 as const, body: { error: "Failed to save sponsor" } };
    }
  },
  deleteSponsor: async (input, c: HonoContext) => {
    try {
      const db = c.get("db");
      const { id } = input.params;
      await db.updateTable("sponsors").set({ is_active: 0 }).where("id", "=", id).execute();
      c.executionCtx.waitUntil(logAuditAction(c, "DEACTIVATE_SPONSOR", "sponsors", id, `Deactivated sponsor ${id}`));
      return { status: 200 as const, body: { success: true } };
    } catch (e) {
      console.error("[Sponsors:Delete] Error", e);
      return { status: 500 as const, body: { error: "Failed to deactivate sponsor" } };
    }
  },
  getAdminTokens: async (_input, c: HonoContext) => {
    try {
      const db = c.get("db");
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
      })) as SponsorTokenResult[];

      return { status: 200 as const, body: { tokens } };
    } catch (e) {
      console.error("[Sponsors:Tokens] Error", e);
      return { status: 500 as const, body: { error: "Failed to fetch tokens" } };
    }
  },
  generateToken: async (input, c: HonoContext) => {
    try {
      const db = c.get("db");
      const { sponsor_id } = input.body;

      if (!sponsor_id) {
        return { status: 400 as const, body: { error: "sponsor_id is required" } };
      }

      const token = crypto.randomUUID();
      await db.insertInto("sponsor_tokens").values({ token, sponsor_id }).execute();

      // WR-13: Don't log the actual token value to prevent token exposure in logs
      c.executionCtx.waitUntil(logAuditAction(c, "GENERATE_TOKEN", "sponsor_tokens", token, `Generated token for ${sponsor_id}`));
      
      c.executionCtx.waitUntil((async () => {
        const sRes = await db.selectFrom("sponsors").select("name").where("id", "=", sponsor_id).executeTakeFirst();
        if (sRes) await sendZulipAlert(c.env, "Sponsor", "ROI Token Generated", `ROI token for **${sRes.name}**.`);
      })());

      return { status: 200 as const, body: { success: true, token } };
    } catch {
      return { status: 500 as const, body: { error: "Failed to generate" } };
    }
  },
};

const sponsorTsRestRouter = s.router(sponsorContract, sponsorHandlers);

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
