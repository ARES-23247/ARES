import { Hono } from "hono";
import { AppEnv, ensureAdmin, persistentRateLimitMiddleware } from "../middleware";

export const simulationsRouter = new Hono<AppEnv>();

// List all simulations from D1
simulationsRouter.get("/", async (c) => {
  try {
    const db = c.get("db");
    const results = await db.selectFrom("simulations")
      .select(["id", "name", "author_id", "is_public", "created_at", "updated_at"])
      .orderBy("updated_at", "desc")
      .execute();

    const formattedSims = results.map(s => ({
      ...s,
      type: "d1"
    }));

    return c.json({ simulations: formattedSims });
  } catch (e) {
    console.error("[Simulations] List error:", e);
    return c.json({ error: "Failed to list simulations from database" }, 500);
  }
});

// Get a single simulation file by id
simulationsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const db = c.get("db");
    const sim = await db.selectFrom("simulations")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!sim) {
      return c.json({ error: "Simulation not found in database" }, 404);
    }
    
    return c.json({
      simulation: {
        id: sim.id,
        name: sim.name,
        type: "d1",
        files: JSON.parse(sim.files),
        author_id: sim.author_id,
        is_public: !!sim.is_public,
        created_at: sim.created_at,
        updated_at: sim.updated_at
      }
    });
  } catch (e) {
    console.error("[Simulations] Get error:", e);
    return c.json({ error: "Failed to get simulation from database" }, 500);
  }
});

// Commit a simulation file to D1
simulationsRouter.post("/", persistentRateLimitMiddleware(10, 60), ensureAdmin, async (c) => {
  const body = await c.req.json();
  const { id, name, files } = body as { 
    id?: string; 
    name?: string; 
    files?: Record<string, string>;
  };

  if (!name || !files || Object.keys(files).length === 0) {
    return c.json({ error: "Name and files are required" }, 400);
  }

  try {
    const db = c.get("db");
    const session = c.get("sessionUser");
    const authorId = session?.id || "admin"; // Fallback to admin if session doesn't populate properly
    
    const finalId = id || crypto.randomUUID();

    await db.insertInto("simulations")
      .values({
        id: finalId,
        name: name,
        files: JSON.stringify(files),
        author_id: authorId,
        is_public: 1
      })
      .onConflict((oc) => oc.column('id').doUpdateSet({
        name: name,
        files: JSON.stringify(files),
        updated_at: new Date().toISOString()
      }))
      .execute();

    return c.json({ success: true, id: finalId });
  } catch (e) {
    console.error("[Simulations] Save error:", e);
    return c.json({ error: "Failed to save simulation to database" }, 500);
  }
});

// Delete a simulation from D1
simulationsRouter.delete("/:id", ensureAdmin, async (c) => {
  const id = c.req.param("id") as string;
  try {
    const db = c.get("db");
    await db.deleteFrom("simulations").where("id", "=", id).execute();
    return c.json({ success: true });
  } catch (e) {
    console.error("[Simulations] Delete error:", e);
    return c.json({ error: "Failed to delete simulation from database" }, 500);
  }
});
