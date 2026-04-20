import { Hono } from "hono";
import { Bindings, MAX_INPUT_LENGTHS, validateLength } from "./_shared";

const inquiriesRouter = new Hono<{ Bindings: Bindings }>();

// ── GET /admin/inquiries — List all inquiries ──────────────────────────
inquiriesRouter.get("/admin/inquiries", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM inquiries ORDER BY created_at DESC"
    ).all();
    return c.json({ inquiries: results });
  } catch (err) {
    console.error("D1 inquiry list error:", err);
    return c.json({ inquiries: [] }, 500);
  }
});

// ── POST /inquiries — Submit a new inquiry ─────────────────────────────
inquiriesRouter.post("/inquiries", async (c) => {
  try {
    const body = await c.req.json();
    const { type, name, email, metadata } = body;

    if (!type || !name || !email) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // SEC-04: Input length validation
    const nameErr = validateLength(name, MAX_INPUT_LENGTHS.name, "Name");
    const emailErr = validateLength(email, MAX_INPUT_LENGTHS.email, "Email");
    if (nameErr) return c.json({ error: nameErr }, 400);
    if (emailErr) return c.json({ error: emailErr }, 400);

    // SEC-07: Simple time-based cooldown — prevent rapid-fire spam from same email
    const recentSubmission = await c.env.DB.prepare(
      "SELECT id FROM inquiries WHERE email = ? AND created_at > datetime('now', '-2 minutes') LIMIT 1"
    ).bind(email).first();
    if (recentSubmission) {
      return c.json({ error: "Please wait a few minutes before submitting another inquiry." }, 429);
    }

    const id = crypto.randomUUID();

    await c.env.DB.prepare(
      "INSERT INTO inquiries (id, type, name, email, metadata) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, type, name, email, metadata ? JSON.stringify(metadata) : null).run();

    return c.json({ success: true, id });
  } catch (err) {
    console.error("D1 inquiry submit error:", err);
    return c.json({ error: "Submission failed" }, 500);
  }
});

// ── PATCH /admin/inquiries/:id/status ──────────────────────────────────
inquiriesRouter.patch("/admin/inquiries/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    
    if (!status) return c.json({ error: "Missing status" }, 400);

    await c.env.DB.prepare(
      "UPDATE inquiries SET status = ? WHERE id = ?"
    ).bind(status, id).run();

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Update failed" }, 500);
  }
});

// ── DELETE /admin/inquiries/:id ────────────────────────────────────────
inquiriesRouter.delete("/admin/inquiries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM inquiries WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Delete failed" }, 500);
  }
});

export default inquiriesRouter;
