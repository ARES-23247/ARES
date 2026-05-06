/* eslint-disable @typescript-eslint/no-explicit-any -- ts-rest handler input validated by contract library */
import { Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { mediaContract } from "../../../../shared/schemas/contracts/mediaContract";
import { AppEnv, ensureAdmin, getSessionUser, logAuditAction } from "../../middleware";
import { mediaHandlers, isValidImage } from "./handlers";
import { Kysely } from "kysely";
import { DB } from "../../../../shared/schemas/database";

const s = initServer<AppEnv>();
const mediaRouter = new Hono<AppEnv>();


const mediaTsRestRouter = s.router(mediaContract, mediaHandlers as any);

// Protections
mediaRouter.use("/admin/*", ensureAdmin);
mediaRouter.use("/admin", ensureAdmin);

// ─── Raw upload route ──────────────────────────────────────────────────
// ts-rest-hono's body parser does an exact Content-Type match against
// "multipart/form-data", but browsers send "multipart/form-data; boundary=..."
// which fails the match. We register a raw Hono handler first so it takes
// priority over the ts-rest generated one.
mediaRouter.post("/admin/upload", async (c) => {
  try {
    const parsed = await c.req.parseBody();
    const file = parsed["file"];
    const folder = (parsed["folder"] as string) || "Library";

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // WR-03: Add maximum file size validation (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` }, 400);
    }

    const isLarge = file.size > 10 * 1024 * 1024;
    let buffer: ArrayBuffer | null = null;
    let headerBuffer: ArrayBuffer;

    if (!isLarge) {
      buffer = await file.arrayBuffer();
      headerBuffer = buffer.slice(0, 1024);
    } else {
      headerBuffer = await file.slice(0, 1024).arrayBuffer();
    }

    if (!isValidImage(headerBuffer)) {
      return c.json({ error: "Invalid file type. Only standard images are supported." }, 400);
    }

    const key = folder ? `${folder}/${file.name}` : file.name;
    if (c.env.ARES_STORAGE) {
      if (isLarge) {
        await (c.env.ARES_STORAGE as any).put(key, file.stream(), { httpMetadata: { contentType: file.type } });
      } else {
        await (c.env.ARES_STORAGE as any).put(key, buffer!, { httpMetadata: { contentType: file.type } });
      }
    }

    let altText = "ARES 23247 Team Media Image";
    const isAiSupported = ["image/jpeg", "image/png"].includes(file.type);
    if (isAiSupported && !isLarge && c.env.AI && (buffer || file.size < 2.5 * 1024 * 1024)) {
      try {
        if (!buffer) buffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        const aiRes = await c.env.AI.run('@cf/llava-1.5-7b-hf', { prompt: 'Describe for screen reader', image: uint8 as any }) as { description?: string };
        if (aiRes?.description) altText = String(aiRes.description).trim();
      } catch (err) {
        console.error("[Media:Upload] AI Error", err);
      }
    }

    const db = c.get("db") as Kysely<DB>;
    await db.insertInto("media_tags")
      .values({ key, folder, tags: altText })
      .onConflict(oc => oc.column("key").doUpdateSet({ folder, tags: altText }))
      .execute();

    if (c.executionCtx) {
      c.executionCtx.waitUntil(logAuditAction(c, "media_upload", "media", key, `Uploaded to ${folder}`));

      if (typeof caches !== 'undefined') {
        c.executionCtx.waitUntil((caches as any).default.delete(new Request(new URL("/api/media", c.req.url).href, { method: "GET" })));
      }
    }

    return c.json({ success: true, key, url: `/api/media/${key}`, altText }, 200);
  } catch (err) {
    console.error("[Media:Upload] Error", err);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// ─── Raw delete route ──────────────────────────────────────────────────
// R2 keys contain slashes (e.g. "Library/image.png"). The ts-rest contract
// uses `:key` which only matches a single path segment, breaking delete
// for any file inside a folder.
mediaRouter.delete("/admin/:key{.+$}", async (c) => {
  const key = decodeURIComponent(c.req.param("key"));
  try {
    if (c.env.ARES_STORAGE) {
      await c.env.ARES_STORAGE.delete(key);
    }
    const db = c.get("db") as Kysely<DB>;
    await db.deleteFrom("media_tags").where("key", "=", key).execute();
    if (c.executionCtx) {
      c.executionCtx.waitUntil(logAuditAction(c, "media_delete", "media", key));
    }
    return c.json({ success: true }, 200);
  } catch (e) {
    console.error("[Media:Delete] Error", e);
    return c.json({ error: "Delete failed" }, 500);
  }
});

createHonoEndpoints(
  mediaContract,
  mediaTsRestRouter,
  mediaRouter,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, _c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);

// GET /media/:key — Serve raw object from R2 (Must be after createHonoEndpoints to avoid catching /admin)
mediaRouter.get("/:key{.+$}", async (c) => {
  const key = c.req.param("key");
  try {
    const folder = key.includes("/") ? key.split("/")[0] : "Uncategorized";
    const publicFolders = ["Gallery", "Library"];
    if (!publicFolders.includes(folder)) {
      const user = await getSessionUser(c);
      if (!user) return c.text("Unauthorized", 401);
    }
    const cache = typeof caches !== 'undefined' ? (caches as any).default : null;
    const url = new URL(c.req.url);
    url.search = "";
    const cacheKey = new Request(url.toString(), { method: "GET" });
    
    if (cache) {
      const cached = await cache.match(cacheKey);
      if (cached && publicFolders.includes(folder)) return cached;
    }

    if (!c.env.ARES_STORAGE) return c.text("R2 Not Bound", 404);
    
    const object = await c.env.ARES_STORAGE.get(key);
    if (!object || !object.body) return c.text("Not Found", 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers as any);
    headers.set("etag", object.httpEtag);
    if (publicFolders.includes(folder)) headers.set("Cache-Control", "public, max-age=2592000, stale-while-revalidate=86400");
    else headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

    const response = new Response(object.body as any, { headers });
    if (cache && publicFolders.includes(folder) && c.executionCtx) {
      c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  } catch (e) {
    console.error("[Media:Raw] Error", e);
    return c.text("Internal Error", 500);
  }
});


export default mediaRouter;

