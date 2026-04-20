import { Hono } from "hono";
import { Bindings } from "./_shared";

const awardsRouter = new Hono<{ Bindings: Bindings }>();

// ── GET /awards — list all awards for public display ──────────────────
awardsRouter.get("/awards", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, title, year, event_name, image_url, description FROM awards ORDER BY year DESC, title ASC"
    ).all();
    return c.json({ awards: results || [] });
  } catch (err) {
    console.error("D1 awards list error:", err);
    return c.json({ awards: [] });
  }
});

// ── GET /admin/awards — list all awards for management ────────────────
awardsRouter.get("/admin/awards", async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM awards ORDER BY year DESC, created_at DESC").all();
    return c.json({ awards: results || [] });
  } catch (err) {
    console.error("D1 admin awards list error:", err);
    return c.json({ awards: [] }, 500);
  }
});

// ── POST /admin/awards — create or update an award ────────────────────
awardsRouter.post("/admin/awards", async (c) => {
  try {
    const body = await c.req.json();
    const { id, title, year, event_name, image_url, description } = body;
    
    if (!id || !title || !year) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    await c.env.DB.prepare(
      "INSERT INTO awards (id, title, year, event_name, image_url, description) VALUES (?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(id) DO UPDATE SET title=excluded.title, year=excluded.year, event_name=excluded.event_name, image_url=excluded.image_url, description=excluded.description"
    ).bind(id, title, year, event_name || null, image_url || null, description || null).run();

    return c.json({ success: true });
  } catch (err) {
    console.error("D1 award save error:", err);
    return c.json({ error: "Save failed" }, 500);
  }
});

// ── DELETE /admin/awards/:id — remove an award ───────────────────────
awardsRouter.delete("/admin/awards/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM awards WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 award delete error:", err);
    return c.json({ error: "Delete failed" }, 500);
  }
});

export default awardsRouter;
