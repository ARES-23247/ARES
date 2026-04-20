import { Hono } from "hono";
import { Bindings, ensureAdmin } from "./_shared";

const analyticsRouter = new Hono<{ Bindings: Bindings }>();

// ── POST /analytics/track — log a page view ──────────────────────────
analyticsRouter.post("/analytics/track", async (c) => {
  try {
    const body = await c.req.json();
    const { path, category, referrer } = body as { path?: string; category?: string; referrer?: string };
    const userAgent = c.req.header("user-agent") || "";
    
    await c.env.DB.prepare(
      `INSERT INTO page_analytics (path, category, referrer, user_agent) VALUES (?, ?, ?, ?)`
    ).bind(
      path || "/", 
      category || "system", 
      referrer || "", 
      userAgent
    ).run();

    return c.json({ success: true });
  } catch (err) {
    console.error("Analytics tracking error:", err);
    return c.json({ success: false }, 500);
  }
});

// ── GET /admin/analytics/summary — Analytics Dashboard ───────────────
analyticsRouter.get("/admin/analytics/summary", ensureAdmin, async (c) => {
  try {
    const [topPages, recentViews, totals] = await Promise.all([
      c.env.DB.prepare(
        "SELECT path, category, COUNT(*) as views FROM page_analytics GROUP BY path, category ORDER BY views DESC LIMIT 10"
      ).all(),
      c.env.DB.prepare(
        "SELECT path, category, user_agent, referrer, timestamp FROM page_analytics ORDER BY timestamp DESC LIMIT 20"
      ).all(),
      c.env.DB.prepare(
        "SELECT category, COUNT(*) as total FROM page_analytics GROUP BY category"
      ).all()
    ]);

    return c.json({
      topPages: topPages.results || [],
      recentViews: recentViews.results || [],
      totals: totals.results || []
    });
  } catch (err) {
    console.error("Analytics summary error:", err);
    return c.json({ topPages: [], recentViews: [], totals: [] }, 500);
  }
});

export default analyticsRouter;
