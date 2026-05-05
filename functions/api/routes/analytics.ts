import { Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { analyticsContract } from "../../../shared/schemas/contracts/analyticsContract";
import { AppEnv, ensureAuth, ensureAdmin, checkRateLimit, rateLimitMiddleware, turnstileMiddleware, getDbSettings  } from "../middleware";
import { sql, Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";

const s = initServer<AppEnv>();
export const analyticsRouter = new Hono<AppEnv>();

import { Context } from "hono";

const analyticsHandlers = {
  trackPageView: async ({ body }: { body: any }, c: Context<AppEnv>) => {
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const ua = c.req.header("User-Agent") || "unknown";
    if (!(await checkRateLimit(c.env.ARES_KV, `track:${ip}`, ua, 20, 600))) {
      return { status: 429 as const, body: { success: false, error: "Rate limit exceeded" } as any };
    }

    const db = c.get("db") as Kysely<DB>;
    try {
      const { path, category, referrer } = body;
      const userAgent = c.req.header("user-agent") || ua;
      
      await db.insertInto("page_analytics")
        .values({
          path: path || "/",
          category: category || "system",
          referrer: referrer || "",
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        })
        .execute();

      return { status: 200 as const, body: { success: true } as any };
    } catch {
      return { status: 500 as const, body: { success: false } as any };
    }
  },
  trackSponsorClick: async ({ body }: { body: any }, c: Context<AppEnv>) => {
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const ua = c.req.header("User-Agent") || "unknown";
    if (!(await checkRateLimit(c.env.ARES_KV, `click:${ip}`, ua, 10, 600))) {
      return { status: 429 as const, body: { success: false, error: "Rate limit exceeded" } as any };
    }

    const db = c.get("db") as Kysely<DB>;
    try {
      const { sponsor_id } = body;

      // WR-04: Validate sponsor exists to prevent database pollution
      if (!sponsor_id || typeof sponsor_id !== 'string') {
        return { status: 400 as const, body: { error: "Invalid sponsor ID" } };
      }

      const sponsor = await db.selectFrom("sponsors")
        .select("id")
        .where("id", "=", sponsor_id)
        .where("is_active", "=", 1)
        .executeTakeFirst();

      if (!sponsor) {
        return { status: 400 as const, body: { error: "Invalid sponsor" } };
      }

      const yearMonth = new Date().toISOString().slice(0, 7);

      await db.insertInto("sponsor_metrics")
        .values({
          id: crypto.randomUUID(),
          sponsor_id,
          year_month: yearMonth,
          clicks: 1,
          impressions: 0
        })
        .onConflict((oc) => oc.columns(["sponsor_id", "year_month"]).doUpdateSet({
          clicks: sql`clicks + 1`
        }))
        .execute();

      return { status: 200 as const, body: { success: true } as any };
    } catch {
      return { status: 500 as const, body: { success: false } as any };
    }
  },
  getSummary: async (_: any, c: Context<AppEnv>) => {
    const db = c.get("db") as Kysely<DB>;
    try {
      const [topPagesRow, recentViewsRow, totalsRow] = await Promise.all([
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

      const topPages = topPagesRow.map(p => ({
        path: String(p.path),
        category: String(p.category),
        views: Number(p.views)
      }));

      const recentViews = recentViewsRow.map(v => ({
        path: String(v.path),
        category: String(v.category),
        user_agent: String(v.user_agent || ""),
        referrer: String(v.referrer || ""),
        timestamp: String(v.timestamp)
      }));

      const totals = totalsRow.map(t => ({
        category: String(t.category),
        total: Number(t.total)
      }));

      return { status: 200 as const, body: { topPages, recentViews, totals } as any };
    } catch {
      return { status: 500 as const, body: { topPages: [], recentViews: [], totals: [] } as any };
    }
  },
  getRosterStats: async (_: any, c: Context<AppEnv>) => {
    const db = c.get("db") as Kysely<DB>;
    try {
      const results = await db.selectFrom("user_profiles as u")
        .innerJoin("user as auth_user", "auth_user.id", "u.user_id")
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
          "auth_user.image as avatar",
          (eb) => eb.fn.sum(eb.case().when("s.attended", "=", 1).then(1).else(0).end()).as("attended_events"),
          (eb) => eb.fn.coalesce(eb.fn.sum(eb.case().when("s.attended", "=", 1).then("s.prep_hours").else(0).end()), sql`0`).as("manual_prep_hours"),
          (eb) => eb.fn.coalesce(
            eb.fn.sum(eb.case()
              .when(eb.and([eb("s.attended", "=", 1), eb("e.is_volunteer", "=", 1)]))
              .then(sql`(strftime('%s', e.date_end) - strftime('%s', e.date_start)) / 3600.0`)
              .else(0)
              .end()
            ), sql`0`
          ).as("event_volunteer_hours")
        ])
        .groupBy(["u.user_id", "u.nickname", "u.member_type", "auth_user.image"])
        .orderBy("u.nickname", "asc")
        .execute();

      const roster = results.map(r => ({
        user_id: String(r.user_id),
        nickname: r.nickname || null,
        member_type: r.member_type || null,
        attended_events: Number(r.attended_events || 0),
        manual_prep_hours: Number(r.manual_prep_hours || 0),
        event_volunteer_hours: Number(r.event_volunteer_hours || 0),
        avatar: r.avatar ? String(r.avatar) : null
      }));

      return { status: 200 as const, body: { roster } as any };
    } catch {
      return { status: 500 as const, body: { roster: [] } as any };
    }
  },
  getLeaderboard: async (_: any, c: Context<AppEnv>) => {
    const db = c.get("db") as Kysely<DB>;
    try {
      const results = await db.selectFrom("user as u")
        .innerJoin("user_profiles as p", "u.id", "p.user_id")
        .innerJoin("user_badges as ub", "u.id", "ub.user_id")
        .select([
          "u.id as user_id",
          "u.name as first_name",
          "p.last_name",
          "p.nickname",
          "p.member_type",
          "u.image as avatar",
          (eb) => eb.fn.count("ub.id").as("badge_count")
        ])
        .where("p.show_on_about", "=", 1)
        .groupBy(["u.id", "u.name", "p.last_name", "p.nickname", "p.member_type", "u.image"])
        .orderBy("badge_count", "desc")
        .limit(50)
        .execute();

      const leaderboard = results.map(r => {
        const isMinor = r.member_type === "student";
        return {
          user_id: String(r.user_id),
          first_name: isMinor ? "ARES Member" : String(r.first_name || "ARES"),
          last_name: isMinor ? null : (r.last_name || null),
          nickname: r.nickname || null,
          member_type: String(r.member_type || "student"),
          badge_count: Number(r.badge_count),
          avatar: r.avatar ? String(r.avatar) : null
        };
      });

      return { status: 200 as const, body: { leaderboard } as any };
    } catch {
      return { status: 500 as const, body: { error: "Failed to fetch leaderboard" } as any };
    }
  },
  getStats: async (_: any, c: Context<AppEnv>) => {
    const db = c.get("db") as Kysely<DB>;
    try {
      const [postsCount, eventsCount, docsCount, securityBlocksRow, dbSettings] = await Promise.all([
        db.selectFrom("posts").select((eb) => eb.fn.count("slug").as("total")).where("is_deleted", "=", 0).executeTakeFirst(),
        db.selectFrom("events").select((eb) => eb.fn.count("id").as("total")).where("is_deleted", "=", 0).executeTakeFirst(),
        db.selectFrom("docs").select((eb) => eb.fn.count("slug").as("total")).where("is_deleted", "=", 0).executeTakeFirst(),
        db.selectFrom("audit_log").select((eb) => eb.fn.count("id").as("total")).where("action", "=", "SECURITY_BLOCK").executeTakeFirst(),
        getDbSettings(c)
      ]);

      return {
        status: 200 as const,
        body: {
          posts: Number(postsCount?.total || 0),
          events: Number(eventsCount?.total || 0),
          docs: Number(docsCount?.total || 0),
          integrations: {
            zulip: !!dbSettings["ZULIP_API_KEY"],
            github: !!dbSettings["GITHUB_PAT"],
            discord: !!dbSettings["DISCORD_WEBHOOK_URL"],
            bluesky: !!dbSettings["BLUESKY_APP_PASSWORD"],
            band: !!dbSettings["BAND_ACCESS_TOKEN"],
            slack: !!dbSettings["SLACK_WEBHOOK_URL"],
            gcal: !!dbSettings["GCAL_PRIVATE_KEY"]
          },
          securityBlocks: Number(securityBlocksRow?.total || 0)
        } as any
      };
    } catch {
      return { status: 500 as const, body: { error: "Failed to fetch stats" } as any };
    }
  },
  getUsageMetrics: async (_: any, c: Context<AppEnv>) => {
    const db = c.get("db") as Kysely<DB>;
    try {
      // Page views summary
      const [totalViews, uniqueVisitors, topPagesData, referrersData, activityData] = await Promise.all([
        db.selectFrom("page_analytics")
          .select((eb) => eb.fn.count("path").as("total"))
          .executeTakeFirst(),
        sql<{ unique: number }>`SELECT COUNT(DISTINCT user_agent) as unique FROM page_analytics`.execute(db).then(r => r.rows[0]),
        db.selectFrom("page_analytics")
          .select(["path", (eb) => eb.fn.count("path").as("views")])
          .groupBy("path")
          .orderBy("views", "desc")
          .limit(10)
          .execute(),
        db.selectFrom("page_analytics")
          .select(["referrer", (eb) => eb.fn.count("referrer").as("visits")])
          .where("referrer", "!=", "")
          .groupBy("referrer")
          .orderBy("visits", "desc")
          .limit(10)
          .execute(),
        // Last 30 days activity
        sql<{ date: string, pageViews: number, uniqueVisitors: number }>`
          SELECT
            date(timestamp, 'localtime') as date,
            COUNT(*) as pageViews,
            COUNT(DISTINCT user_agent) as uniqueVisitors
          FROM page_analytics
          WHERE timestamp >= datetime('now', '-30 days')
          GROUP BY date(timestamp, 'localtime')
          ORDER BY date DESC
          LIMIT 30
        `.execute(db)
      ]);

      // Resource usage from media tags (R2 assets tracked in media_tags)
      const assetsCount = await db.selectFrom("media_tags")
        .select((eb) => eb.fn.count("key").as("total"))
        .executeTakeFirst();

      const [apiCount, latencyData] = await Promise.all([
        // Gracefully handle if usage_metrics table doesn't exist yet
        db.selectFrom("usage_metrics")
          .select((eb) => eb.fn.count("id").as("total"))
          .executeTakeFirst()
          .catch(() => ({ total: 0 })),
        sql<{ date: string, avg_latency: number }>`
          SELECT
            date(timestamp, 'localtime') as date,
            AVG(latency_ms) as avg_latency
          FROM usage_metrics
          WHERE timestamp >= datetime('now', '-30 days')
          GROUP BY date(timestamp, 'localtime')
          ORDER BY date ASC
        `.execute(db)
          .catch(() => ({ rows: [] }))
      ]);

      const summary = {
        totalPageViews: Number(totalViews?.total || 0),
        uniqueVisitors: Number(uniqueVisitors?.unique || 0),
        avgSessionDuration: 0, // Placeholder - requires session tracking
        topPages: topPagesData.map(p => ({
          path: String(p.path),
          views: Number(p.views),
          uniqueVisitors: 0, // Simplified - would require additional query
        })),
        topReferrers: referrersData.map(r => ({
          referrer: String(r.referrer),
          visits: Number(r.visits),
        })),
        userActivity: activityData.rows?.map(a => ({
          date: String(a.date),
          pageViews: Number(a.pageViews),
          uniqueVisitors: Number(a.uniqueVisitors),
        })) || [],
        latency: latencyData.rows?.map(l => ({
          date: String(l.date),
          avg_latency: Number(l.avg_latency)
        })) || [],
        resourceUsage: {
          totalAssets: Number(assetsCount?.total || 0),
          totalStorage: 0, // R2 storage would require external API
          apiCalls: Number(apiCount?.total || 0),
        },
      };

      return { status: 200 as const, body: { summary } as any };
    } catch (err) {
      console.error("[Analytics] Usage metrics error:", err);
      return { status: 500 as const, body: { error: "Failed to fetch usage metrics" } as any };
    }
  },
  search: async ({ query }: { query: any }, c: Context<AppEnv>) => {
    const db = c.get("db") as Kysely<DB>;
    const { q } = query;
    try {
      // SCA-FTS-01: Sanitize FTS5 query
      const qClean = (q || "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
      if (!qClean) return { status: 200 as const, body: { results: [] } as any };
      const ftsQ = `"${qClean}"*`;

      const [postsReq, eventsReq, docsReq] = await Promise.all([
        sql<{ id: string, title: string }>`SELECT f.slug as id, f.title FROM posts_fts f JOIN posts p ON f.slug = p.slug WHERE p.is_deleted = 0 AND p.status = 'published' AND f.posts_fts MATCH ${ftsQ} LIMIT 5`.execute(db),
        sql<{ id: string, title: string }>`SELECT f.id, f.title FROM events_fts f JOIN events e ON f.id = e.id WHERE e.is_deleted = 0 AND e.status = 'published' AND f.events_fts MATCH ${ftsQ} LIMIT 5`.execute(db),
        sql<{ id: string, title: string }>`SELECT f.slug as id, f.title FROM docs_fts f JOIN docs d ON f.slug = d.slug WHERE d.status = 'published' AND d.is_deleted = 0 AND f.docs_fts MATCH ${ftsQ} LIMIT 5`.execute(db)
      ]);

      const results = [
        ...(postsReq.rows || []).map(r => ({ type: "blog" as const, id: r.id, title: r.title })),
        ...(eventsReq.rows || []).map(r => ({ type: "event" as const, id: r.id, title: r.title })),
        ...(docsReq.rows || []).map(r => ({ type: "doc" as const, id: r.id, title: r.title }))
      ];

      return { status: 200 as const, body: { results } as any };
    } catch {
      return { status: 500 as const, body: { error: "Search failed" } as any };
    }
  }
};

const analyticsTsRestRouter = s.router(analyticsContract, analyticsHandlers as any);

// CR-01 FIX: Apply authentication to all analytics routes
// Public routes (page view tracking, search) have rate limiting only
analyticsRouter.use("/summary", ensureAuth);
analyticsRouter.use("/stats", ensureAuth);
analyticsRouter.use("/usage-metrics", ensureAuth);
analyticsRouter.use("/roster-stats", ensureAuth);
analyticsRouter.use("/leaderboard", ensureAuth);

// Apply ensureAdmin ONLY to administrative routes
analyticsRouter.use("/admin/*", ensureAdmin);

analyticsRouter.use("/sponsor-click", turnstileMiddleware());
analyticsRouter.use("/search", rateLimitMiddleware(100, 60));

createHonoEndpoints(analyticsContract, analyticsTsRestRouter, analyticsRouter);

export default analyticsRouter;
