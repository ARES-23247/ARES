import { Hono } from "hono";
import { AppEnv, ensureAdmin, persistentRateLimitMiddleware } from "../middleware";

export const simulationsRouter = new Hono<AppEnv>();

// List all simulations
simulationsRouter.get("/", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT id, name, author_id, created_at, updated_at FROM simulations ORDER BY updated_at DESC"
    ).all();
    return c.json({ simulations: result.results || [] });
  } catch (e) {
    console.error("[Simulations] List error:", e);
    return c.json({ error: "Failed to list simulations" }, 500);
  }
});

// Get a single simulation by ID
simulationsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM simulations WHERE id = ?"
    ).bind(id).first();
    if (!result) return c.json({ error: "Simulation not found" }, 404);
    return c.json({ simulation: result });
  } catch (e) {
    console.error("[Simulations] Get error:", e);
    return c.json({ error: "Failed to get simulation" }, 500);
  }
});

// Create or update a simulation (admin only)
simulationsRouter.post("/", persistentRateLimitMiddleware(10, 60), ensureAdmin, async (c) => {
  const body = await c.req.json();
  const { name, code, id } = body as { name?: string; code?: string; id?: number };

  if (!name || !code) {
    return c.json({ error: "Name and code are required" }, 400);
  }

  const sessionUser = c.get("sessionUser") as { id?: string } | undefined;
  const authorId = sessionUser?.id || "unknown";

  try {
    if (id) {
      // Update existing
      await c.env.DB.prepare(
        "UPDATE simulations SET name = ?, code = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(name, code, id).run();
      return c.json({ success: true, id });
    } else {
      // Create new
      const result = await c.env.DB.prepare(
        "INSERT INTO simulations (name, code, author_id) VALUES (?, ?, ?)"
      ).bind(name, code, authorId).run();
      return c.json({ success: true, id: result.meta?.last_row_id });
    }
  } catch (e) {
    console.error("[Simulations] Save error:", e);
    return c.json({ error: "Failed to save simulation" }, 500);
  }
});

// Delete a simulation (admin only)
simulationsRouter.delete("/:id", ensureAdmin, async (c) => {
  const id = c.req.param("id");
  try {
    await c.env.DB.prepare("DELETE FROM simulations WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (e) {
    console.error("[Simulations] Delete error:", e);
    return c.json({ error: "Failed to delete simulation" }, 500);
  }
});
