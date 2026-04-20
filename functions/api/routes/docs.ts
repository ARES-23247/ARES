import { Hono } from "hono";
import { Bindings, ensureAdmin, getSessionUser } from "./_shared";

const docsRouter = new Hono<{ Bindings: Bindings }>();

// ── GET /docs — list all docs grouped by category ─────────────────────
docsRouter.get("/docs", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT slug, title, category, sort_order, description, is_portfolio, is_executive_summary FROM docs WHERE is_deleted = 0 AND status = 'published' ORDER BY category, sort_order ASC"
    ).all();
    return c.json({ docs: results ?? [] });
  } catch (err) {
    console.error("D1 docs list error:", err);
    return c.json({ docs: [] });
  }
});

// ── GET /docs/search?q=keyword — full-text search ─────────────────────
docsRouter.get("/docs/search", async (c) => {
  const q = c.req.query("q");
  if (!q || q.length < 2) return c.json({ results: [] });
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT slug, title, category, description, content FROM docs WHERE is_deleted = 0 AND status = 'published' AND (title LIKE ? OR content LIKE ? OR description LIKE ?) ORDER BY category, sort_order ASC LIMIT 20"
    ).bind(`%${q}%`, `%${q}%`, `%${q}%`).all();

    const mapped = (results ?? []).map((r: Record<string, unknown>) => {
      const content = String(r.content || "");
      const idx = content.toLowerCase().indexOf(q.toLowerCase());
      const start = Math.max(0, idx - 100);
      const end = Math.min(content.length, idx + q.length + 100);
      
      let snippet = idx >= 0 ? content.slice(start, end) : (String(r.description || ""));
      
      const regex = new RegExp(`(${q})`, "gi");
      snippet = snippet.replace(regex, "**$1**");

      return {
        slug: r.slug,
        title: r.title,
        category: r.category,
        description: r.description,
        snippet: idx >= 0 ? "..." + snippet + "..." : (r.description || ""),
      };
    });
    return c.json({ results: mapped });
  } catch (err) {
    console.error("D1 docs search error:", err);
    return c.json({ results: [] });
  }
});

// ── POST /docs/:slug/feedback — Submit doc feedback ───────────────────
docsRouter.post("/docs/:slug/feedback", async (c) => {
  try {
    const slug = c.req.param("slug");
    const { isHelpful, comment } = await c.req.json();
    await c.env.DB.prepare(
      "INSERT INTO docs_feedback (slug, is_helpful, comment) VALUES (?, ?, ?)"
    ).bind(slug, isHelpful ? 1 : 0, comment || null).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 feedback error:", err);
    return c.json({ error: "Feedback failed" }, 500);
  }
});

// ── GET /docs/:slug — single doc page ─────────────────────────────────
docsRouter.get("/docs/:slug", async (c) => {
  const slug = c.req.param("slug");
  try {
    const row = await c.env.DB.prepare(
      "SELECT slug, title, category, description, content, updated_at, is_portfolio, is_executive_summary FROM docs WHERE slug = ? AND is_deleted = 0 AND status = 'published'"
    ).bind(slug).first();
    if (!row) return c.json({ error: "Doc not found" }, 404);
    return c.json({ doc: row });
  } catch (err) {
    console.error("D1 doc read error:", err);
    return c.json({ error: "Database error" }, 500);
  }
});

// ── GET /admin/docs — list all docs (admin) ───────────────────────────
docsRouter.get("/admin/docs", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT slug, title, category, sort_order, description, is_portfolio, is_executive_summary, is_deleted, status FROM docs ORDER BY category, sort_order ASC"
    ).all();
    return c.json({ docs: results ?? [] });
  } catch (err) {
    console.error("D1 admin docs list error:", err);
    return c.json({ docs: [] });
  }
});

// ── GET /admin/docs/export-all — export all docs as JSON backup (admin) ──
docsRouter.get("/admin/docs/export-all", ensureAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT slug, title, category, sort_order, description, content, is_portfolio, is_executive_summary, status FROM docs WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY category, sort_order`
    ).all();

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "aresweb-docs-v1",
      count: results.length,
      docs: results,
    };

    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="aresweb-docs-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    console.error("Docs export error:", err);
    return c.json({ error: "Export failed" }, 500);
  }
});

// ── POST /admin/docs — create/update a doc (admin) ────────────────────
docsRouter.post("/admin/docs", async (c) => {
  try {
    const email = c.req.header("cf-access-authenticated-user-email") || "anonymous_admin";
    const { slug, title, category, sortOrder, description, content, isPortfolio, isExecutiveSummary } = await c.req.json();
    if (!slug || !title || !category || !content) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Capture history before update
    const existing = await c.env.DB.prepare("SELECT * FROM docs WHERE slug = ?").bind(slug).first();
    if (existing) {
       await c.env.DB.prepare(
         `INSERT INTO docs_history (slug, title, category, description, content, author_email)
          VALUES (?, ?, ?, ?, ?, ?)`
       ).bind(existing.slug, existing.title, existing.category, existing.description, existing.content, existing.cf_email || "unknown").run();
    }

    const user = await getSessionUser(c);
    const status = user?.role === "admin" ? "published" : "pending";

    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO docs (slug, title, category, sort_order, description, content, cf_email, updated_at, is_portfolio, is_executive_summary, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)`
    ).bind(slug, title, category, sortOrder || 0, description || "", content, email, isPortfolio ? 1 : 0, isExecutiveSummary ? 1 : 0, status).run();
    
    return c.json({ success: true, slug });
  } catch (err) {
    console.error("D1 doc write error:", err);
    return c.json({ error: "Write failed" }, 500);
  }
});

// ── DELETE /admin/docs/:slug — soft-delete (admin) ─────────────────────
docsRouter.delete("/admin/docs/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    await c.env.DB.prepare("UPDATE docs SET is_deleted = 1 WHERE slug = ?").bind(slug).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 soft-delete error (docs):", err);
    return c.json({ error: "Soft-delete failed" }, 500);
  }
});

// ── PATCH /admin/docs/:slug/undelete — restore (admin) ────────────────
docsRouter.patch("/admin/docs/:slug/undelete", async (c) => {
  try {
    const slug = c.req.param("slug");
    await c.env.DB.prepare("UPDATE docs SET is_deleted = 0 WHERE slug = ?").bind(slug).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 undelete error (docs):", err);
    return c.json({ error: "Undelete failed" }, 500);
  }
});

// ── DELETE /admin/docs/:slug/purge — PERMANENTLY delete (admin) ────────
docsRouter.delete("/admin/docs/:slug/purge", async (c) => {
  try {
    const slug = c.req.param("slug");
    await c.env.DB.prepare("DELETE FROM docs WHERE slug = ?").bind(slug).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 purge error (docs):", err);
    return c.json({ error: "Purge failed" }, 500);
  }
});

// ── PATCH /admin/docs/:slug/sort — update doc sort_order ───────────────
docsRouter.patch("/admin/docs/:slug/sort", async (c) => {
  try {
    const slug = c.req.param("slug");
    const { sortOrder } = await c.req.json();
    if (typeof sortOrder !== 'number') {
      return c.json({ error: "Invalid sortOrder" }, 400);
    }
    await c.env.DB.prepare("UPDATE docs SET sort_order = ? WHERE slug = ?").bind(sortOrder, slug).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 doc sort update error:", err);
    return c.json({ error: "Sort update failed" }, 500);
  }
});

// ── PATCH /admin/docs/:slug/approve — approve pending doc (admin) ─────
docsRouter.patch("/admin/docs/:slug/approve", async (c) => {
  try {
    const user = await getSessionUser(c);
    if (user?.role !== "admin") return c.json({ error: "Unauthorized" }, 401);
    const slug = c.req.param("slug");
    await c.env.DB.prepare("UPDATE docs SET status = 'published' WHERE slug = ?").bind(slug).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("D1 approve error (docs):", err);
    return c.json({ error: "Approval failed" }, 500);
  }
});

export default docsRouter;
