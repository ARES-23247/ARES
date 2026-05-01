import { Hono } from "hono";
import { AppEnv } from "../middleware";

export const simulationsRouter = new Hono<AppEnv>();

// List all simulations from GitHub
simulationsRouter.get("/", async (c) => {
  try {
    const db = c.get("db");
    const config = await db.selectFrom("settings").selectAll().execute();
    const patSetting = config.find(s => s.key === "GITHUB_PAT");
    const pat = patSetting?.value || c.env.GITHUB_PAT;
    const headers: Record<string, string> = {
      "User-Agent": "ARES-Cloudflare-Worker",
      "Accept": "application/vnd.github.v3.raw"
    };
    if (pat) headers["Authorization"] = `Bearer ${pat}`;

    const ghRes = await fetch(`https://api.github.com/repos/ARES-23247/ARESWEB/contents/src/sims/simRegistry.json`, { headers });
    if (!ghRes.ok) {
       return c.json({ simulations: [] });
    }
    
    const registryText = await ghRes.text();
    const registry = JSON.parse(registryText);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const githubSims = registry.simulators.map((s: any) => ({
      id: `github:${s.id}`,
      name: s.name,
      author_id: "ARES-23247",
      is_public: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "github"
    }));

    return c.json({ simulations: githubSims });
  } catch (e) {
    console.error("[Simulations] List error:", e);
    return c.json({ error: "Failed to list simulations from GitHub" }, 500);
  }
});

// Get a single simulation file by id from GitHub
simulationsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  if (!id.startsWith("github:")) {
    return c.json({ error: "Simulation not found" }, 404);
  }

  const simId = id.replace("github:", "");
  try {
    const db = c.get("db");
    const config = await db.selectFrom("settings").selectAll().execute();
    const patSetting = config.find(s => s.key === "GITHUB_PAT");
    const pat = patSetting?.value || c.env.GITHUB_PAT;
    const headers: Record<string, string> = {
      "User-Agent": "ARES-Cloudflare-Worker",
      "Accept": "application/vnd.github.v3.raw"
    };
    if (pat) headers["Authorization"] = `Bearer ${pat}`;

    const ghRes = await fetch(`https://api.github.com/repos/ARES-23247/ARESWEB/contents/src/sims/${simId}.tsx`, { headers });
    if (!ghRes.ok) {
      return c.json({ error: "Simulation not found in GitHub" }, 404);
    }
    
    const code = await ghRes.text();
    return c.json({
      simulation: {
        id: id,
        name: simId,
        type: "github",
        files: { [`${simId}.tsx`]: code },
        author_id: "ARES-23247",
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  } catch (ghErr) {
    console.error("[Simulations] GitHub get error:", ghErr);
    return c.json({ error: "Failed to get simulation from GitHub" }, 500);
  }
});
