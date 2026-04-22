import { Hono } from "hono";
import { AppEnv, ensureAdmin, getDbSettings, checkRateLimit } from "./_shared";

const mediaRouter = new Hono<AppEnv>();
const adminMediaRouter = new Hono<AppEnv>();

// ── POST /admin/upload — File Upload via R2 & AI Image Accessibility ──
adminMediaRouter.post("/upload", ensureAdmin, async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"] as File;
    const folder = (body["folder"] as string) || "Library";

    if (!file) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // GAP-07: Enforce 10MB upload limit
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "File too large. Maximum size is 10MB." }, 413);
    }

    // SEC-DoW: UUID prefix makes keys unguessable — prevents enumeration attacks
    const key = `${crypto.randomUUID().slice(0, 8)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const arrayBuffer = await file.arrayBuffer();

    // 1. Storage Upload
    const uploadTask = c.env.ARES_STORAGE.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    // 2. Automated AI Accessibility Tagging (LLava Vision)
    let altText = "ARES 23247 Team Media Image";
    try {
      if (c.env.AI) {
        if (arrayBuffer.byteLength > 2.5 * 1024 * 1024) {
          console.warn("Image exceeds Edge AI memory threshold. Falling back to generic alt text.");
        } else {
          const uint8 = Array.from(new Uint8Array(arrayBuffer));
          const aiResponse = await c.env.AI.run('@cf/llava-1.5-7b-hf', {
            prompt: 'Describe this image for screen readers in 1 sentence. Make it helpful, concise, and focused on robotics if applicable.',
            image: uint8
          });
          if ((aiResponse as { description?: string })?.description) {
            altText = String((aiResponse as { description?: string }).description).trim();
          }
        }
      }
    } catch (aiErr) {
      console.error("AI Vision generation failed, utilizing fallback alt text:", aiErr);
    }

    await uploadTask;

    // 3. Register Logical Metadata
    try {
       await c.env.DB.prepare(
         `INSERT INTO media_tags (key, folder, tags) VALUES (?, ?, ?)`
       ).bind(key, folder, altText).run();
    } catch (e) {
       console.error("D1 registry warning, table might not exist in this environment:", e);
    }

    return c.json({ success: true, url: `/api/media/${key}`, key, folder, altText });
  } catch (err) {
    console.error("R2 upload error:", err);
    return c.json({ error: "Storage upload failed" }, 500);
  }
});

// ── GET /media/:key — proxy R2 images (Edge-Cached) ───────────────────
mediaRouter.get("/:key", async (c) => {
  // SEC-DoW: Rate limit public media access (200 req/min per IP)
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, 200, 60)) {
    return c.text("Too many requests", 429);
  }

  // SEC-DoW: Check Cloudflare Edge CDN cache first — costs $0, skips R2 Class B op
  // @ts-expect-error — Cloudflare Workers runtime: caches.default is the global Edge Cache
  const cache = caches.default;
  const cacheKey = new Request(c.req.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Cache miss — fetch from R2 (billable Class B operation)
  const key = c.req.param("key") || "";
  const object = await c.env.ARES_STORAGE.get(key);

  if (!object) {
    // SEC-DoW: Cache 404s to prevent brute-force key enumeration from burning R2 ops
    const notFound = new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=60" },
    });
    c.executionCtx.waitUntil(cache.put(cacheKey, notFound.clone()));
    return notFound;
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  const response = new Response(object.body, { headers });
  // SEC-DoW: Store in Edge CDN — subsequent requests from same PoP skip R2 entirely
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
});

// ── GET /media — list public R2 objects (Gallery only, Edge-Cached) ───
mediaRouter.get("/", async (c) => {
  // SEC-DoW: Rate limit gallery listing (30 req/min per IP — list() is expensive)
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, 30, 60)) {
    return c.text("Too many requests", 429);
  }

  try {
    // SEC-DoW: Check Edge CDN cache — saves R2 list() Class B op + D1 query
    // @ts-expect-error — Cloudflare Workers runtime: caches.default is the global Edge Cache
    const cache = caches.default;
    const cacheKey = new Request(c.req.url, { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const [objects, dbRes] = await Promise.all([
      c.env.ARES_STORAGE.list(),
      c.env.DB.prepare("SELECT key, folder, tags FROM media_tags WHERE folder = 'Gallery'").all().catch(() => ({ results: [] }))
    ]);

    const results = (dbRes.results || []) as { key: string, folder: string, tags: string }[];
    const publicKeys = new Set(results.map(r => r.key));

    const merged = objects.objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(obj => publicKeys.has((obj as any).key))
      .map(obj => ({
        ...obj,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: `/api/media/${(obj as any).key}`,
        folder: "Gallery",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tags: results.find(r => r.key === (obj as any).key)?.tags || ""
      }));

    const payload = { media: merged };
    // SEC-DoW: Edge-cache gallery for 5 min (replaces fragile per-isolate in-memory cache)
    const response = new Response(JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  } catch (err) {
    console.error("R2 public list error:", err);
    return c.json({ error: "List failed", media: [] }, 500);
  }
});

// ── GET /admin/media — list all R2 objects (CMS Admins) ───────────────
adminMediaRouter.get("/", async (c) => {
  try {
    const [objects, dbRes] = await Promise.all([
      c.env.ARES_STORAGE.list(),
      c.env.DB.prepare("SELECT key, folder, tags FROM media_tags").all().catch(() => ({ results: [] }))
    ]);

    const metaMap = new Map();
    for (const row of (dbRes.results || []) as { key: string, folder: string, tags: string }[]) {
      metaMap.set(row.key, { folder: row.folder, tags: row.tags });
    }

    const merged = objects.objects.map(obj => ({
      ...obj,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      url: `/api/media/${(obj as any).key}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      folder: metaMap.get((obj as any).key)?.folder || "Library",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: metaMap.get((obj as any).key)?.tags || ""
    }));

    return c.json({ media: merged });
  } catch (err) {
    console.error("R2 admin list error:", err);
    return c.json({ error: "List failed", media: [] }, 500);
  }
});

// ── DELETE /admin/media/:key — delete R2 object (admin) ─────────────────
adminMediaRouter.delete("/:key", ensureAdmin, async (c) => {
  try {
    const key = (c.req.param("key") || "") as string;
    // ensureAdmin already validated the session — use context
    const sessionUser = c.get("sessionUser") as { role: string } | undefined;
    const role = sessionUser?.role || "user";

    if (role === "admin") {
      await Promise.all([
        c.env.ARES_STORAGE.delete(key),
        c.env.DB.prepare("DELETE FROM media_tags WHERE key = ?").bind(key).run().catch(() => {})
      ]);
    } else {
      // Authors trigger soft-deletion mechanism (archived/ prefix)
      const obj = await c.env.ARES_STORAGE.get(key);
      if (obj) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await c.env.ARES_STORAGE.put(`archived/${key}`, (obj as any).body, { httpMetadata: (obj as any).httpMetadata });
        await c.env.ARES_STORAGE.delete(key);
      }
      await c.env.DB.prepare("UPDATE media_tags SET folder = 'Archived', key = ? WHERE key = ?").bind(`archived/${key}`, key).run().catch(() => {});
    }
    return c.json({ success: true });

  } catch (err) {
    console.error("R2 delete error:", err);
    return c.json({ error: "Delete failed" }, 500);
  }
});

// ── PUT /admin/media/:key/move — change folder (admin) ─────────────────
adminMediaRouter.put("/:key/move", ensureAdmin, async (c) => {
  try {
    const key = (c.req.param("key") || "") as string;
    const body = await c.req.json();
    const newFolder = body?.folder || "";

    // SEC-F06: Validate folder name against allowed values
    const ALLOWED_FOLDERS = ["Gallery", "Library", "Blog", "Events", "Sponsors", "Docs", "Archived"];
    if (!ALLOWED_FOLDERS.includes(newFolder)) {
      return c.json({ error: `Invalid folder. Must be one of: ${ALLOWED_FOLDERS.join(", ")}` }, 400);
    }

    await c.env.DB.prepare("UPDATE media_tags SET folder = ? WHERE key = ?").bind(newFolder, key).run();
    return c.json({ success: true, folder: newFolder });
  } catch (err) {
    console.error("R2 move error:", err);
    return c.json({ error: "Move failed" }, 500);
  }
});

// ── POST /admin/media/syndicate — Cross-post Asset to Socials (admin) ─
adminMediaRouter.post("/syndicate", ensureAdmin, async (c) => {
  try {
    const { key, caption } = await c.req.json();
    if (!key || !caption) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const config = await getDbSettings(c);
    
    const imageUrl = `${new URL(c.req.url).origin}/api/media/${key}`;
    const { dispatchPhotoSocials } = await import("../../utils/socialSync");
    
    try {
      await dispatchPhotoSocials(imageUrl, caption, config);
      return c.json({ success: true, message: "Syndication dispatched successfully" });
    } catch (err: unknown) {
      console.error("Dispatch photo socials failed:", err);
      return c.json({ error: `Network Syndication Failed: ${(err as Error)?.message || String(err)}` }, 502);
    }
  } catch (err) {
    console.error("Syndicate dispatch error:", err);
    return c.json({ error: "Failed to dispatch syndication hook" }, 500);
  }
});

export { adminMediaRouter }; export default mediaRouter;
