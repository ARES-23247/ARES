import { Hono } from "hono";
import { AppEnv, ensureAuth } from "../middleware";
import { z } from "zod";

// Validation schema for simulation save
const saveSimulationSchema = z.object({
  name: z.string().max(100).optional(),
  files: z.record(z.string(), z.string().max(500000)), // 500KB max per file
});

export const simulationsRouter = new Hono<AppEnv>();

// Helper: Check if user owns a simulation or is admin
async function canModifySimulation(c: any, simId: string): Promise<boolean> {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) return false;

  // Admins can modify any simulation
  if (sessionUser.role === "admin") return true;

  // Check if user is the author by fetching the file's commit history
  try {
    const db = c.get("db");
    const config = await db.selectFrom("settings").selectAll().execute();
    const patSetting = config.find((s: any) => s.key === "GITHUB_PAT");
    const pat = patSetting?.value || c.env.GITHUB_PAT;

    if (!pat) return false;

    const headers: Record<string, string> = {
      "User-Agent": "ARES-Cloudflare-Worker",
      "Authorization": `Bearer ${pat}`,
      "Accept": "application/vnd.github.v3+json"
    };

    // Get the file metadata to check creation
    const path = `src/sims/${simId}.tsx`;
    const url = `https://api.github.com/repos/ARES-23247/ARESWEB/commits?path=${path}&per_page=1`;

    const res = await fetch(url, { headers });
    if (!res.ok) return false;

    const commits = await res.json() as any[];
    if (!commits || commits.length === 0) return false;

    // Check commit author email matches user
    const authorEmail = commits[0]?.author?.email;
    return authorEmail === sessionUser.email;
  } catch {
    // If we can't verify ownership, be conservative
    return false;
  }
}

// List all simulations from GitHub
simulationsRouter.get("/", async (c) => {
  try {
    const db = c.get("db");
    const config = await db.selectFrom("settings").selectAll().execute();
    const patSetting = config.find(s => s.key === "GITHUB_PAT");
    const pat = patSetting?.value || c.env.GITHUB_PAT;

    // WR-17: Log PAT status without exposing the token value
    const patStatus = pat ? `configured (ends with ${String(pat).slice(-4)})` : "missing";
    console.log("[Simulations] Using GitHub PAT:", patStatus);

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
    
    const githubSims = registry.simulators.map((s: { id: string; name: string }) => ({
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

    // WR-17: Log PAT status without exposing the token value
    const patStatus = pat ? `configured (ends with ${String(pat).slice(-4)})` : "missing";
    console.log("[Simulations] Using GitHub PAT:", patStatus);

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

// Save simulation to GitHub
simulationsRouter.post("/", ensureAuth, async (c) => {
  try {
    const sessionUser = c.get("sessionUser");
    if (!sessionUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const validationResult = saveSimulationSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json({ error: "Invalid input: " + validationResult.error.issues.map(i => i.message).join(", ") }, 400);
    }

    const { name, files } = validationResult.data;

    if (Object.keys(files).length === 0) {
      return c.json({ error: "No files provided" }, 400);
    }

    const db = c.get("db");
    const config = await db.selectFrom("settings").selectAll().execute();
    const patSetting = config.find(s => s.key === "GITHUB_PAT");
    const pat = patSetting?.value || c.env.GITHUB_PAT;
    
    if (!pat) {
      return c.json({ error: "GitHub PAT not configured" }, 500);
    }

    const headers: Record<string, string> = {
      "User-Agent": "ARES-Cloudflare-Worker",
      "Authorization": `Bearer ${pat}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    };
    
    // Attempt to use the active file or generic fallback
    const rawFilename = Object.keys(files)[0];
    let filename = rawFilename;
    let simIdStr = filename.replace(/\.tsx?$/, '');

    // If it's the generic SimComponent or renamed, we map it to the requested simulation name
    if (filename === 'SimComponent.tsx' && name) {
      simIdStr = name.replace(/[^a-zA-Z0-9]/g, '');
      filename = `${simIdStr}.tsx`;
    }

    const content = files[rawFilename];
    
    // Safely encode to base64
    // Cloudflare Workers support btoa. unescape+encodeURIComponent handles utf-8 safely.
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    const path = `src/sims/${filename}`;
    const url = `https://api.github.com/repos/ARES-23247/ARESWEB/contents/${path}`;

    let sha: string | undefined;
    const getRes = await fetch(url, { headers });
    if (getRes.ok) {
      const getJson = (await getRes.json()) as any;
      sha = getJson.sha;
      // File exists - check ownership before allowing update
      if (!(await canModifySimulation(c, simIdStr))) {
        console.warn(`[Simulations] Unauthorized modification attempt by ${sessionUser.email} on ${simIdStr}`);
        return c.json({ error: "You can only modify your own simulations" }, 403);
      }
    }

    const putRes = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `feat(sims): update ${filename} via Simulation Playground`,
        content: base64Content,
        sha: sha
      })
    });
    
    if (!putRes.ok) {
      const err = await putRes.text();
      console.error("[Simulations] GitHub PUT error:", err);
      return c.json({ error: "Failed to upload to GitHub" }, 500);
    }

    // Update registry if new
    if (!sha) {
      const regUrl = `https://api.github.com/repos/ARES-23247/ARESWEB/contents/src/sims/simRegistry.json`;
      const regGetRes = await fetch(regUrl, { headers });
      if (regGetRes.ok) {
        const regJson = (await regGetRes.json()) as any;
        const regSha = regJson.sha;
        const regContentStr = decodeURIComponent(escape(atob(regJson.content)));
        try {
          const registry = JSON.parse(regContentStr);
          
          if (!registry.simulators.some((s: any) => s.id === simIdStr)) {
            registry.simulators.push({
              id: simIdStr,
              name: name || simIdStr,
              path: `./${simIdStr}`,
              requiresContext: false
            });
            
            const newRegContent = JSON.stringify(registry, null, 2);
            const newRegBase64 = btoa(unescape(encodeURIComponent(newRegContent)));
            
            await fetch(regUrl, {
              method: "PUT",
              headers,
              body: JSON.stringify({
                message: `feat(sims): register ${simIdStr} in simRegistry.json`,
                content: newRegBase64,
                sha: regSha
              })
            });
          }
        } catch (e) {
          console.error("[Simulations] Registry update failed:", e);
        }
      }
    }
    
    return c.json({ id: `github:${simIdStr}` });
  } catch (e) {
    console.error("[Simulations] Save error:", e);
    return c.json({ error: "Failed to save simulation" }, 500);
  }
});
// Delete simulation from GitHub
simulationsRouter.delete("/:id", async (c) => {
  try {
    const sessionUser = c.get("sessionUser");
    if (!sessionUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const id = c.req.param("id");
    if (!id.startsWith("github:")) {
      return c.json({ error: "Not found" }, 404);
    }
    
    const simIdStr = id.replace("github:", "");
    
    const db = c.get("db");
    const config = await db.selectFrom("settings").selectAll().execute();
    const patSetting = config.find(s => s.key === "GITHUB_PAT");
    const pat = patSetting?.value || c.env.GITHUB_PAT;
    
    if (!pat) {
      return c.json({ error: "GitHub PAT not configured" }, 500);
    }

    const headers: Record<string, string> = {
      "User-Agent": "ARES-Cloudflare-Worker",
      "Authorization": `Bearer ${pat}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    };

    const path = `src/sims/${simIdStr}.tsx`;
    const url = `https://api.github.com/repos/ARES-23247/ARESWEB/contents/${path}`;

    let sha: string | undefined;
    const getRes = await fetch(url, { headers });
    if (getRes.ok) {
      const getJson = (await getRes.json()) as any;
      sha = getJson.sha;
    }

    if (sha) {
      // Check ownership before allowing deletion
      if (!(await canModifySimulation(c, simIdStr))) {
        console.warn(`[Simulations] Unauthorized deletion attempt by ${sessionUser.email} on ${simIdStr}`);
        return c.json({ error: "You can only delete your own simulations" }, 403);
      }
      const delRes = await fetch(url, {
        method: "DELETE",
        headers,
        body: JSON.stringify({
          message: `feat(sims): delete ${simIdStr}.tsx via Simulation Playground`,
          sha: sha
        })
      });
      
      if (!delRes.ok) {
        console.error("[Simulations] GitHub DELETE error:", await delRes.text());
      }
    }
    
    // Also remove from registry
    const regUrl = `https://api.github.com/repos/ARES-23247/ARESWEB/contents/src/sims/simRegistry.json`;
    const regGetRes = await fetch(regUrl, { headers });
    if (regGetRes.ok) {
      const regJson = (await regGetRes.json()) as any;
      const regSha = regJson.sha;
      const regContentStr = decodeURIComponent(escape(atob(regJson.content)));
      try {
        const registry = JSON.parse(regContentStr);
        const filtered = registry.simulators.filter((s: any) => s.id !== simIdStr);
        
        if (filtered.length !== registry.simulators.length) {
          registry.simulators = filtered;
          const newRegContent = JSON.stringify(registry, null, 2);
          const newRegBase64 = btoa(unescape(encodeURIComponent(newRegContent)));
          
          await fetch(regUrl, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              message: `feat(sims): remove ${simIdStr} from simRegistry.json`,
              content: newRegBase64,
              sha: regSha
            })
          });
        }
      } catch (e) {
        console.error("[Simulations] Registry update failed:", e);
      }
    }

    return c.json({ success: true });
  } catch (e) {
    console.error("[Simulations] Delete error:", e);
    return c.json({ error: "Failed to delete simulation" }, 500);
  }
});
