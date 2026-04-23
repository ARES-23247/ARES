import { Hono } from "hono";
import { AppEnv, ensureAdmin, logAuditAction, MAX_INPUT_LENGTHS } from "../../middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const adminSeasonsRouter = new Hono<AppEnv>();

const seasonSchema = z.object({
  id: z.string().min(1).max(20), // e.g. '2025-2026'
  challenge_name: z.string().min(1).max(MAX_INPUT_LENGTHS.name),
  robot_name: z.string().max(MAX_INPUT_LENGTHS.name).optional(),
  robot_image: z.string().optional(),
  robot_description: z.string().optional(), // AST JSON string
  robot_cad_url: z.string().optional(),
  summary: z.string().max(MAX_INPUT_LENGTHS.generic).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(["published", "draft"]).default("published")
});

// ── GET /admin/seasons ── list all (including drafts) ──────────
adminSeasonsRouter.get("/", ensureAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM seasons WHERE is_deleted = 0 ORDER BY start_date DESC"
    ).all();
    return c.json({ seasons: results || [] });
  } catch (err) {
    console.error("D1 admin seasons list error:", err);
    return c.json({ seasons: [] });
  }
});

// ── POST /admin/seasons ── create or update ───────────
adminSeasonsRouter.post("/", ensureAdmin, zValidator("json", seasonSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const { id } = data;

    const existing = await c.env.DB.prepare(
      "SELECT id FROM seasons WHERE id = ?"
    ).bind(id).first();

    if (existing) {
      // Update
      await c.env.DB.prepare(`
        UPDATE seasons SET 
          challenge_name = ?, 
          robot_name = ?, 
          robot_image = ?, 
          robot_description = ?, 
          robot_cad_url = ?, 
          summary = ?, 
          start_date = ?, 
          end_date = ?, 
          status = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        data.challenge_name,
        data.robot_name || null,
        data.robot_image || null,
        data.robot_description || null,
        data.robot_cad_url || null,
        data.summary || null,
        data.start_date || null,
        data.end_date || null,
        data.status,
        id
      ).run();
      await logAuditAction(c, "season_updated", "seasons", id, `Season "${id}" updated`);
    } else {
      // Insert
      await c.env.DB.prepare(`
        INSERT INTO seasons (
          id, challenge_name, robot_name, robot_image, robot_description, 
          robot_cad_url, summary, start_date, end_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        data.challenge_name,
        data.robot_name || null,
        data.robot_image || null,
        data.robot_description || null,
        data.robot_cad_url || null,
        data.summary || null,
        data.start_date || null,
        data.end_date || null,
        data.status
      ).run();
      await logAuditAction(c, "season_created", "seasons", id, `Season "${id}" created`);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("D1 admin seasons save error:", err);
    return c.json({ error: "Save failed" }, 500);
  }
});

// ── DELETE /admin/seasons/:id ── soft-delete ────────────────
adminSeasonsRouter.delete("/:id", ensureAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    await c.env.DB.prepare("UPDATE seasons SET is_deleted = 1 WHERE id = ?").bind(id).run();
    await logAuditAction(c, "season_deleted", "seasons", id, `Season "${id}" soft-deleted`);
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 admin seasons delete error:", err);
    return c.json({ error: "Delete failed" }, 500);
  }
});

// ── GET /admin/seasons/:id ── get season details ──────────────
adminSeasonsRouter.get("/:id", ensureAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    const season = await c.env.DB.prepare(
      "SELECT * FROM seasons WHERE id = ? AND is_deleted = 0"
    ).bind(id).first();
    
    if (!season) return c.json({ error: "Season not found" }, 404);
    return c.json({ season });
  } catch (err) {
    console.error("D1 admin season details error:", err);
    return c.json({ error: "Failed to fetch season details" }, 500);
  }
});

export default adminSeasonsRouter;
