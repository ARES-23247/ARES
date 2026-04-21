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

// ── GET /admin/backup — Export database as JSON ───────────────
settingsRouter.get("/admin/backup", ensureAdmin, async (c) => {
  try {
    const { results: tables } = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE '%_fts%'"
    ).all();
    
    const backup: Record<string, Record<string, unknown>[]> = {};
    for (const row of tables) {
      if (!row || typeof row.name !== 'string') continue;
      const { results } = await c.env.DB.prepare(`SELECT * FROM ${row.name}`).all();
      backup[row.name] = results;
    }
    
    await logAuditAction(c, "database_export", "system", null, "Exported full D1 database backup as JSON.");
    
    return c.json({ success: true, timestamp: new Date().toISOString(), backup });
  } catch (err) {
    console.error("D1 backup error:", err);
    return c.json({ success: false, error: "Backup generation failed" }, 500);
  }
});

export default settingsRouter;
