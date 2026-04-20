import { Hono } from "hono";
import { Bindings } from "./_shared";

const outreachRouter = new Hono<{ Bindings: Bindings }>();

// ── GET /outreach — list all outreach logs for public report ──────────
outreachRouter.get("/outreach", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, title, date, location, students_count, hours_logged, reach_count, description FROM outreach_logs ORDER BY date DESC"
    ).all();
    return c.json({ logs: results || [] });
  } catch (err) {
    console.error("D1 outreach list error:", err);
    return c.json({ logs: [] });
  }
});

// ── GET /admin/outreach — list all outreach logs for management ───────
outreachRouter.get("/admin/outreach", async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM outreach_logs ORDER BY date DESC").all();
    return c.json({ logs: results || [] });
  } catch (err) {
    console.error("D1 admin outreach list error:", err);
    return c.json({ logs: [] }, 500);
  }
});

// ── POST /admin/outreach — create or update an outreach log ───────────
outreachRouter.post("/admin/outreach", async (c) => {
  try {
    const body = await c.req.json();
    const { id, title, date, location, students_count, hours_logged, reach_count, description } = body;
    
    if (!id || !title || !date) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    await c.env.DB.prepare(
      "INSERT INTO outreach_logs (id, title, date, location, students_count, hours_logged, reach_count, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(id) DO UPDATE SET title=excluded.title, date=excluded.date, location=excluded.location, students_count=excluded.students_count, hours_logged=excluded.hours_logged, reach_count=excluded.reach_count, description=excluded.description"
    ).bind(id, title, date, location || null, students_count || 0, hours_logged || 0, reach_count || 0, description || null).run();

    return c.json({ success: true });
  } catch (err) {
    console.error("D1 outreach save error:", err);
    return c.json({ error: "Save failed" }, 500);
  }
});

// ── DELETE /admin/outreach/:id — remove an outreach log ────────────────
outreachRouter.delete("/admin/outreach/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM outreach_logs WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 outreach delete error:", err);
    return c.json({ error: "Delete failed" }, 500);
  }
});

export default outreachRouter;
