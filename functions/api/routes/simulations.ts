import { Hono } from "hono";
import { AppEnv, ensureAdmin, persistentRateLimitMiddleware } from "../middleware";

export const simulationsRouter = new Hono<AppEnv>();

// List all simulations
simulationsRouter.get("/", async (c) => {
  try {
    const sessionUser = c.get("sessionUser") as { id?: string } | undefined;
    const userId = sessionUser?.id || "anonymous";

    // Fetch from database
    const dbSims = await c.env.DB.prepare(
      "SELECT id, name, description, author_id, is_public, created_at, updated_at FROM simulations WHERE is_public = 1 OR author_id = ? ORDER BY updated_at DESC"
    ).bind(userId).all();

    const formattedSims = (dbSims.results || []).map((sim: any) => ({
      ...sim,
      type: "database"
    }));

    // TODO: Add dynamic fetching of GitHub official templates
    // For now, return the DB sims as the primary source
    
    return c.json({ simulations: formattedSims });
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
    
    if (!result) {
      // TODO: If not in DB, try fetching from GitHub using the id as the folder name
      return c.json({ error: "Simulation not found" }, 404);
    }
    
    // Parse the JSON files payload
    if (result.files && typeof result.files === 'string') {
      try {
        result.files = JSON.parse(result.files);
      } catch (e) {
        console.error("Failed to parse files JSON:", e);
        result.files = {};
      }
    }

    return c.json({ simulation: { ...result, type: "database" } });
  } catch (e) {
    console.error("[Simulations] Get error:", e);
    return c.json({ error: "Failed to get simulation" }, 500);
  }
});

// Create or update a simulation
simulationsRouter.post("/", persistentRateLimitMiddleware(10, 60), ensureAdmin, async (c) => {
  const body = await c.req.json();
  const { id, name, description, files, is_public } = body as { 
    id?: string; 
    name?: string; 
    description?: string;
    files?: Record<string, string>;
    is_public?: boolean;
  };

  if (!name || !files || Object.keys(files).length === 0) {
    return c.json({ error: "Name and files are required" }, 400);
  }

  const sessionUser = c.get("sessionUser") as { id?: string } | undefined;
  const authorId = sessionUser?.id || "unknown";
  const filesJson = JSON.stringify(files);
  const isPublicInt = is_public ? 1 : 0;

  try {
    if (id) {
      // Update existing
      await c.env.DB.prepare(
        "UPDATE simulations SET name = ?, description = ?, files = ?, is_public = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(name, description || "", filesJson, isPublicInt, id).run();
      return c.json({ success: true, id });
    } else {
      // Create new
      const newId = crypto.randomUUID();
      await c.env.DB.prepare(
        "INSERT INTO simulations (id, name, description, author_id, is_public, files) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(newId, name, description || "", authorId, isPublicInt, filesJson).run();
      return c.json({ success: true, id: newId });
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
