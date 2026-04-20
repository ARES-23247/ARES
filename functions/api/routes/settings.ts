import { Hono } from "hono";
import { Bindings, ensureAdmin, getDbSettings, logAuditAction, validateLength, MAX_INPUT_LENGTHS } from "./_shared";

const settingsRouter = new Hono<{ Bindings: Bindings }>();

// ── GET /admin/settings — get all integrations settings ───────────────
settingsRouter.get("/admin/settings", ensureAdmin, async (c) => {
  try {
    const settings = await getDbSettings(c);
    return c.json({ success: true, settings });
  } catch (err) {
    console.error("D1 settings read error:", err);
    return c.json({ success: false, settings: {} }, 500);
  }
});

// ── POST /admin/settings — upsert settings key-value pairs ────────────
settingsRouter.post("/admin/settings", ensureAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const entries = Object.entries(body) as [string, string][];
    
    for (const [key, value] of entries) {
      // SEC-01: Length validation for all keys
      const error = validateLength(value, MAX_INPUT_LENGTHS.generic, key);
      if (error) return c.json({ error }, 400);

      await c.env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
      ).bind(key, value).run();
    }
    
    await logAuditAction(c, "updated_settings", "system_settings", null, `Updated ${entries.length} integration keys.`);
    return c.json({ success: true, updated: entries.length });
  } catch (err) {
    console.error("D1 settings write error:", err);
    return c.json({ error: "Settings save failed" }, 500);
  }
});

export default settingsRouter;
