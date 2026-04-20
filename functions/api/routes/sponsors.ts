import { Hono } from "hono";
import { Bindings } from "./_shared";

const sponsorsRouter = new Hono<{ Bindings: Bindings }>();

// ── GET /sponsors — list active sponsors for public display ───────────
sponsorsRouter.get("/sponsors", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, name, tier, logo_url, website_url FROM sponsors WHERE is_active = 1 ORDER BY CASE tier WHEN 'Titanium' THEN 1 WHEN 'Gold' THEN 2 WHEN 'Silver' THEN 3 ELSE 4 END"
    ).all();
    return c.json({ sponsors: results || [] });
  } catch (err) {
    console.error("D1 sponsors list error:", err);
    return c.json({ sponsors: [] });
  }
});

sponsorsRouter.get("/admin/sponsors", async (c) => {
  try {
    const limit = Math.min(Number(c.req.query("limit") || "50"), 200);
    const offset = Number(c.req.query("offset") || "0");
    const { results } = await c.env.DB.prepare("SELECT id, name, tier, logo_url, website_url, is_active, created_at FROM sponsors ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(limit, offset).all();
    return c.json({ sponsors: results || [] });
  } catch (err) {
    console.error("D1 admin sponsors list error:", err);
    return c.json({ sponsors: [] });
  }
});

// ── POST /admin/sponsors — create or update a sponsor (admin) ──────
sponsorsRouter.post("/admin/sponsors", async (c) => {
  try {
    const body = await c.req.json();
    const { id, name, tier, logo_url, website_url, is_active } = body;
    
    if (!id || !name || !tier) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    await c.env.DB.prepare(
      "INSERT INTO sponsors (id, name, tier, logo_url, website_url, is_active) VALUES (?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(id) DO UPDATE SET name=excluded.name, tier=excluded.tier, logo_url=excluded.logo_url, website_url=excluded.website_url, is_active=excluded.is_active"
    ).bind(id, name, tier, logo_url || null, website_url || null, is_active ?? 1).run();

    return c.json({ success: true });
  } catch (err) {
    console.error("D1 sponsor save error:", err);
    return c.json({ error: "Save failed" }, 500);
  }
});

// ── DELETE /admin/sponsors/:id — remove a sponsor (admin) ─────────
sponsorsRouter.delete("/admin/sponsors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM sponsors WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 sponsor delete error:", err);
    return c.json({ error: "Delete failed" }, 500);
  }
});

export default sponsorsRouter;
