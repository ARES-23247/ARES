import { Hono } from "hono";
import { AppEnv, ensureAdmin, parsePagination, logAuditAction, validateLength, MAX_INPUT_LENGTHS  } from "../middleware";

const awardsRouter = new Hono<AppEnv>();

// ── GET / ── list all awards ──────────
awardsRouter.get("/", async (c) => {
  try {
    const { limit, offset } = parsePagination(c, 50, 100);
    const { results } = await c.env.DB.prepare(
      "SELECT id, title, date as year, event_name, description, icon_type as image_url FROM awards WHERE is_deleted = 0 ORDER BY date DESC, title ASC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all();
    return c.json({ awards: results || [] });
  } catch (err) {
    console.error("D1 awards list error:", err);
    return c.json({ awards: [] });
  }
});

// ── POST / ── create or update an award ───────────
awardsRouter.post("/", ensureAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { id, title, year, event_name, description, image_url } = body;

    if (!title || !year) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // SEC-F05: Input length validation
    const titleErr = validateLength(title, MAX_INPUT_LENGTHS.name, "Title");
    if (titleErr) return c.json({ error: titleErr }, 400);
    const descErr = validateLength(description, MAX_INPUT_LENGTHS.generic, "Description");
    if (descErr) return c.json({ error: descErr }, 400);
    const eventErr = validateLength(event_name, MAX_INPUT_LENGTHS.name, "Event name");
    if (eventErr) return c.json({ error: eventErr }, 400);

    let exists = false;
    if (id) {
      const row = await c.env.DB.prepare("SELECT id FROM awards WHERE id = ?").bind(id).first();
      if (row) exists = true;
    }

    if (exists) {
      // Update existing
      await c.env.DB.prepare(
        "UPDATE awards SET title = ?, date = ?, event_name = ?, description = ?, icon_type = ? WHERE id = ?"
      ).bind(title, String(year), event_name || "", description || null, image_url || "trophy", id).run();
      await logAuditAction(c, "award_updated", "awards", id, `Award "${title}" (${year}) updated`);
    } else {
      // Insert new
      const newId = id || crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO awards (id, title, date, event_name, description, icon_type) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(newId, title, String(year), event_name || "", description || null, image_url || "trophy").run();
      await logAuditAction(c, "award_created", "awards", newId, `Award "${title}" (${year}) created`);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("D1 awards save error:", err);
    return c.json({ error: "Save failed" }, 500);
  }
});

// ── DELETE /:id ── soft-delete an award ────────────────
awardsRouter.delete("/:id", ensureAdmin, async (c) => {
  try {
    const id = (c.req.param("id") || "");
    await c.env.DB.prepare("UPDATE awards SET is_deleted = 1 WHERE id = ?").bind(id).run();
    await logAuditAction(c, "award_deleted", "awards", id, "Award soft-deleted");
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 awards delete error:", err);
    return c.json({ error: "Delete failed" }, 500);
  }
});

export default awardsRouter;
