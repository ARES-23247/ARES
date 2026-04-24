import { Hono } from "hono";
import { AppEnv, ensureAdmin, logAuditAction, MAX_INPUT_LENGTHS, rateLimitMiddleware } from "../../middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const adminSeasonsRouter = new Hono<AppEnv>();

const seasonSchema = z.object({
  start_year: z.number().int().min(2000).max(2100),
  end_year: z.number().int().min(2000).max(2100),
  challenge_name: z.string().min(1).max(MAX_INPUT_LENGTHS.name),
  robot_name: z.string().max(MAX_INPUT_LENGTHS.name).optional(),
  robot_image: z.string().optional(),
  robot_description: z.string().optional(), // AST JSON string
  robot_cad_url: z.string().optional(),
  summary: z.string().max(MAX_INPUT_LENGTHS.generic).optional(),
  album_url: z.string().url().optional().or(z.literal("")),
  album_cover: z.string().url().optional().or(z.literal("")),
  status: z.enum(["published", "draft"]).default("published")
});

// ── GET /admin/seasons ── list all (including drafts) ──────────
adminSeasonsRouter.get("/", ensureAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM seasons WHERE is_deleted = 0 ORDER BY start_year DESC"
    ).all();
    return c.json({ seasons: results || [] });
  } catch (err) {
    console.error("D1 admin seasons list error:", err);
    return c.json({ seasons: [] });
  }
});

// ── POST /admin/seasons ── create or update ───────────
adminSeasonsRouter.post("/", ensureAdmin, rateLimitMiddleware(15, 60), zValidator("json", seasonSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const { start_year } = data;

    const existing = await c.env.DB.prepare(
      "SELECT start_year FROM seasons WHERE start_year = ?"
    ).bind(start_year).first();

    if (existing) {
      // Update
      await c.env.DB.prepare(`
        UPDATE seasons SET 
          end_year = ?,
          challenge_name = ?, 
          robot_name = ?, 
          robot_image = ?, 
          robot_description = ?, 
          robot_cad_url = ?, 
          summary = ?, 
          album_url = ?,
          album_cover = ?,
          status = ?,
          updated_at = datetime('now')
        WHERE start_year = ?
      `).bind(
        data.end_year,
        data.challenge_name,
        data.robot_name || null,
        data.robot_image || null,
        data.robot_description || null,
        data.robot_cad_url || null,
        data.summary || null,
        data.album_url || null,
        data.album_cover || null,
        data.status,
        start_year
      ).run();
      await logAuditAction(c, "season_updated", "seasons", start_year.toString(), `Season "${start_year}" updated`);
    } else {
      // Insert
      await c.env.DB.prepare(`
        INSERT INTO seasons (
          start_year, end_year, challenge_name, robot_name, robot_image, robot_description, 
          robot_cad_url, summary, album_url, album_cover, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        start_year,
        data.end_year,
        data.challenge_name,
        data.robot_name || null,
        data.robot_image || null,
        data.robot_description || null,
        data.robot_cad_url || null,
        data.summary || null,
        data.album_url || null,
        data.album_cover || null,
        data.status
      ).run();
      await logAuditAction(c, "season_created", "seasons", start_year.toString(), `Season "${start_year}" created`);
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
    const id = c.req.param("id"); // This is start_year
    await c.env.DB.prepare("UPDATE seasons SET is_deleted = 1 WHERE start_year = ?").bind(id).run();
    await logAuditAction(c, "season_deleted", "seasons", id as string, `Season "${id}" soft-deleted`);
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 admin seasons delete error:", err);
    return c.json({ error: "Delete failed" }, 500);
  }
});

// ── GET /admin/seasons/:id ── get season details ──────────────
adminSeasonsRouter.get("/:id", ensureAdmin, async (c) => {
  try {
    const id = c.req.param("id"); // This is start_year
    const season = await c.env.DB.prepare(
      "SELECT * FROM seasons WHERE start_year = ? AND is_deleted = 0"
    ).bind(id).first();
    
    if (!season) return c.json({ error: "Season not found" }, 404);
    return c.json({ season });
  } catch (err) {
    console.error("D1 admin season details error:", err);
    return c.json({ error: "Failed to fetch season details" }, 500);
  }
});

export default adminSeasonsRouter;
