import { Hono } from "hono";
import { AppEnv, ensureAdmin, logAuditAction, parsePagination, rateLimitMiddleware } from "../middleware";
import { sendZulipAlert } from "../../utils/zulipSync";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { sponsorContract } from "../../../src/schemas/contracts/sponsorContract";
import { sql } from "kysely";

const sponsorsRouter = new Hono<AppEnv>();
const s = initServer<AppEnv>();

const sponsorTsRestRouter = s.router(sponsorContract, {
  getSponsors: async ({ c }: any) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .where("is_active", "=", 1)
        .orderBy(sql<number>`CASE tier WHEN 'Titanium' THEN 1 WHEN 'Gold' THEN 2 WHEN 'Silver' THEN 3 ELSE 4 END`)
        .execute();
      return {
        status: 200 as const,
        body: { sponsors: results as any },
      };
    } catch (err) {
      console.error("D1 sponsors list error:", err);
      return { status: 200 as const, body: { sponsors: [] } };
    }
  },
  getAdminSponsors: async ({ c }: any) => {
    try {
      const db = c.get("db");
      const { limit, offset } = parsePagination(c, 50, 200);
      const results = await db.selectFrom("sponsors")
        .select(["id", "name", "tier", "logo_url", "website_url", "is_active"])
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset)
        .execute();
      return {
        status: 200 as const,
        body: { sponsors: results as any },
      };
    } catch (err) {
      console.error("D1 admin sponsors list error:", err);
      return { status: 200 as const, body: { sponsors: [] } };
    }
  },
  createSponsor: async ({ body, c }: any) => {
    try {
      const db = c.get("db");
      const { id, name, tier, logo_url, website_url, is_active } = body;
      const finalId = id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      await db.insertInto("sponsors")
        .values({
          id: finalId,
          name,
          tier,
          logo_url: logo_url || null,
          website_url: website_url || null,
          is_active: is_active ?? 1
        })
        .onConflict((oc: any) => oc
          .column('id')
          .doUpdateSet({
            name: (eb: any) => eb.ref('excluded.name'),
            tier: (eb: any) => eb.ref('excluded.tier'),
            logo_url: (eb: any) => eb.ref('excluded.logo_url'),
            website_url: (eb: any) => eb.ref('excluded.website_url'),
            is_active: (eb: any) => eb.ref('excluded.is_active')
          })
        )
        .execute();

      await logAuditAction(c, "sponsor_saved", "sponsors", finalId, `Sponsor "${name}" (${tier}) saved`);
      return {
        status: 200 as const,
        body: { success: true, id: finalId as any },
      };
    } catch (err) {
      console.error("D1 sponsor save error:", err);
      return { status: 200 as const, body: { success: false } }; // Map to internal errors if needed
    }
  },
  deleteSponsor: async ({ params, c }: any) => {
    try {
      const db = c.get("db");
      const { id } = params;
      await db.updateTable("sponsors").set({ is_active: 0 }).where("id", "=", id).execute();
      await logAuditAction(c, "sponsor_deactivated", "sponsors", id, "Sponsor deactivated (soft-delete)");
      return {
        status: 200 as const,
        body: { success: true },
      };
    } catch (err) {
      console.error("D1 sponsor delete error:", err);
      return { status: 200 as const, body: { success: false } };
    }
  },
} as any);

// Register ts-rest endpoints
createHonoEndpoints(sponsorContract, sponsorTsRestRouter, sponsorsRouter);

// ── GET /sponsors/roi/:token — Public (hidden) Sponsor Dashboard ────
sponsorsRouter.get("/roi/:token", async (c) => {
  try {
    const db = c.get("db");
    const token = (c.req.param("token") || "");
    const tokens = await db.selectFrom("sponsor_tokens")
      .select("sponsor_id")
      .where("token", "=", token)
      .execute();

    if (!tokens || tokens.length === 0) {
      return c.json({ error: "Invalid token" }, 403);
    }

    const sponsor_id = tokens[0].sponsor_id;

    // Fetch sponsor details
    const sponsorResult = await db.selectFrom("sponsors")
      .select(["id", "name", "tier", "logo_url", "website_url"])
      .where("id", "=", sponsor_id)
      .execute();

    // Fetch metrics
    const metricsResult = await db.selectFrom("sponsor_metrics")
      .select(["year_month", "impressions", "clicks"])
      .where("sponsor_id", "=", sponsor_id)
      .orderBy("year_month", "asc")
      .execute();

    return c.json({ 
      sponsor: sponsorResult?.[0], 
      metrics: metricsResult || [] 
    });
  } catch (err) {
    console.error("D1 sponsor ROI error:", err);
    return c.json({ error: "Failed to fetch ROI" }, 500);
  }
});

// ── GET /admin/tokens — Get Tokens for Admins (admin) ──────
sponsorsRouter.get("/admin/tokens", ensureAdmin, async (c) => {
  try {
    const db = c.get("db");
    const results = await db.selectFrom("sponsor_tokens as t")
      .innerJoin("sponsors as s", "t.sponsor_id", "s.id")
      .select(["t.token", "t.sponsor_id", "s.name as sponsor_name", "t.created_at"])
      .orderBy("t.created_at", "desc")
      .execute();
    return c.json({ tokens: results || [] });
  } catch {
    return c.json({ tokens: [] }, 500);
  }
});

// ── POST /admin/tokens/generate — Generate Token (admin) ──────
sponsorsRouter.post("/admin/tokens/generate", ensureAdmin, rateLimitMiddleware(15, 60), async (c) => {
  try {
    const db = c.get("db");
    const { sponsor_id } = await c.req.json();
    if (!sponsor_id) return c.json({ error: "Missing sponsor_id"}, 400);
    const token = crypto.randomUUID();
    
    await db.insertInto("sponsor_tokens")
      .values({ token, sponsor_id })
      .execute();

    await logAuditAction(c, "sponsor_token_generated", "sponsor_tokens", token, `ROI token generated for sponsor ${sponsor_id}`);

    c.executionCtx.waitUntil((async () => {
      try {
        const sRes = await db.selectFrom("sponsors").select("name").where("id", "=", sponsor_id).executeTakeFirst();
        if (sRes) {
          await sendZulipAlert(
            c.env,
            "Sponsor",
            "New Sponsor ROI Token Generated",
            `A magic ROI access link was just generated for **${sRes.name}**.\nTheir engagement and click metrics are now securely accessible via their specific token link.`
          );
        }
      } catch (err) {
        console.error("Failed to sync sponsor creation to Zulip", err);
      }
    })());

    return c.json({ success: true, token });
  } catch {
    return c.json({ error: "Failed to generate" }, 500);
  }
});

export default sponsorsRouter;
