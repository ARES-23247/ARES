import { Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { analyticsContract } from "../../../src/schemas/contracts/analyticsContract";
import { AppEnv, ensureAdmin, checkRateLimit, turnstileMiddleware  } from "../middleware";
import { sql } from "kysely";

const s = initServer<AppEnv>();
const analyticsRouter = new Hono<AppEnv>();

const analyticsTsRestRouter = s.router(analyticsContract, {
  trackPageView: async ({ body }: { body: { path?: string; category?: string; referrer?: string; "cf-turnstile-response"?: string } }, c) => {
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    if (!checkRateLimit(`track:${ip}`, 20, 600)) {
      return { status: 429, body: { success: false, error: "Rate limit exceeded" } };
    }

    const db = c.get("db");
    try {
      const { path, category, referrer } = body;
      const userAgent = c.req.header("user-agent") || "";
      
      await db.insertInto("page_analytics")
        .values({
          path: path || "/",
          category: category || "system",
          referrer: referrer || "",
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        })
        .execute();

      return { status: 200, body: { success: true } };
    } catch (err) {
      console.error("Analytics tracking error:", err);
      return { status: 500, body: { success: false, error: "Tracking failed" } };
    }
  },
  trackSponsorClick: async ({ body }: { body: { sponsor_id: string; "cf-turnstile-response"?: string } }, c) => {
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    if (!checkRateLimit(`click:${ip}`, 10, 600)) {
      return { status: 429, body: { success: false, error: "Rate limit exceeded" } };
    }

    const db = c.get("db");
    try {
      const { sponsor_id } = body;
      const yearMonth = new Date().toISOString().slice(0, 7);
      
      await db.insertInto("sponsor_metrics")
        .values({
          id: crypto.randomUUID(),
          sponsor_id,
          year_month: yearMonth,
          clicks: 1,
          impressions: 0
        })
        .onConflict(oc => oc.columns(["sponsor_id", "year_month"]).doUpdateSet({
          clicks: (eb) => eb.bxp("clicks", "+", 1)
        }))
        .execute();

      return { status: 200, body: { success: true } };
    } catch (err) {
      console.error("Sponsor tracking error:", err);
      return { status: 500, body: { success: false, error: "Sponsor tracking failed" } };
    }
  },
  getSummary: async (_: unknown, c) => {
    const db = c.get("db");
    try {
      const [topPages, recentViews, totals] = await Promise.all([
        db.selectFrom("page_analytics")
          .select(["path", "category", (eb) => eb.fn.count("path").as("views")])
          .groupBy(["path", "category"])
          .orderBy("views", "desc")
          .limit(10)
          .execute(),
        db.selectFrom("page_analytics")
          .select(["path", "category", "user_agent", "referrer", "timestamp"])
          .orderBy("timestamp", "desc")
          .limit(20)
          .execute(),
        db.selectFrom("page_analytics")
          .select(["category", (eb) => eb.fn.count("category").as("total")])
          .groupBy("category")
          .execute()
      ]);

      return { status: 200, body: {
        topPages: topPages as unknown as unknown[],
        recentViews: recentViews as unknown as unknown[],
        totals: totals as unknown as unknown[]
      }};
    } catch (err) {
      console.error("Analytics summary error:", err);
      return { status: 500, body: { topPages: [], recentViews: [], totals: [] } };
    }
  },
  getRosterStats: async (_: unknown, c) => {
    const db = c.get("db");
    try {
      const results = await db.selectFrom("user_profiles as u")
        .leftJoin("event_signups as s", "u.user_id", "s.user_id")
        .leftJoin("events as e", (join) => join
          .onRef("s.event_id", "=", "e.id")
          .on("e.status", "=", "published")
          .on("e.is_deleted", "=", 0)
        )
        .select([
          "u.user_id",
          "u.nickname",
          "u.member_type",
          (eb) => eb.fn.sum(eb.case().when("s.attended", "=", 1).then(1).else(0).end()).as("attended_events"),
          (eb) => eb.fn.coalesce(eb.fn.sum(eb.case().when("s.attended", "=", 1).then("s.prep_hours").else(0).end()), sql`0`).as("manual_prep_hours"),
          (eb) => eb.fn.coalesce(
            eb.fn.sum(eb.case()
              .when("s.attended", "=", 1)
              .and("e.is_volunteer", "=", 1)
              .then(sql`(strftime('%s', e.date_end) - strftime('%s', e.date_start)) / 3600.0`)
              .else(0)
              .end()
            ), sql`0`
          ).as("event_volunteer_hours")
        ])
        .groupBy(["u.user_id", "u.nickname", "u.member_type"])
        .orderBy("u.nickname", "asc")
        .execute();

      return { status: 200, body: { roster: results as unknown as unknown[] } };
    } catch (err) {
      console.error("Roster stats error:", err);
      return { status: 500, body: { roster: [] } };
    }
  },
});

// Middleware for public tracking (Turnstile)
analyticsRouter.use("/track", turnstileMiddleware());
analyticsRouter.use("/sponsor-click", turnstileMiddleware());

// Middleware for admin reporting
analyticsRouter.use("/admin", ensureAdmin);
analyticsRouter.use("/admin/*", ensureAdmin);

createHonoEndpoints(analyticsContract, analyticsTsRestRouter, analyticsRouter);

export default analyticsRouter;

