/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Hono } from "hono";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { docContract } from "../../../src/schemas/contracts/docContract";
import { siteConfig } from "../../utils/site.config";
import { AppEnv, ensureAdmin, ensureAuth, getSessionUser, checkRateLimit, verifyTurnstile, emitNotification, notifyByRole } from "../middleware";
import { sendZulipMessage } from "../../utils/zulipSync";
import { sql } from "kysely";

const s = initServer<AppEnv>();
const docsRouter = new Hono<AppEnv>();

// SEC-Z01: Cache doc search results
const MAX_CACHE_SIZE = 100;
const docSearchCache = new Map<string, { data: unknown; expiresAt: number }>();

function setCache(key: string, value: { data: unknown; expiresAt: number }) {
  if (docSearchCache.size >= MAX_CACHE_SIZE) {
    const firstKey = docSearchCache.keys().next().value;
    if (firstKey !== undefined) docSearchCache.delete(firstKey);
  }
  docSearchCache.set(key, value);
}

async function pruneDocHistory(c: Context<AppEnv>, slug: string, limit = 10) {
  try {
    const db = c.get("db");
    const results = await db.selectFrom("docs_history")
      .select("id")
      .where("slug", "=", slug)
      .orderBy("created_at", "desc")
      .offset(limit - 1)
      .limit(1)
      .execute();

    if (results.length > 0) {
      const oldestId = results[0].id;
      await db.deleteFrom("docs_history")
        .where("slug", "=", slug)
        .where("id", "<", oldestId)
        .execute();
    }
  } catch (err) {
    console.error("[DocsHistory] Prune failed:", err);
  }
}

const docHandlers: any = {
  getDocs: async (_: any, c: any) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("docs")
        .leftJoin("user as u", "docs.cf_email", "u.email")
        .leftJoin("user_profiles as p", "u.id", "p.user_id")
        .select([
          "docs.slug",
          "docs.title",
          "docs.category",
          "docs.sort_order",
          "docs.description",
          "docs.is_portfolio",
          "docs.is_executive_summary",
          "p.nickname as original_author_nickname",
          "u.image as original_author_avatar"
        ])
        .where("docs.is_deleted", "=", 0)
        .where("docs.status", "=", "published")
        .orderBy("docs.category")
        .orderBy("docs.sort_order", "asc")
        .execute();
      return { status: 200, body: { docs: results as unknown[] } };
    } catch {
      return { status: 200, body: { docs: [] } };
    }
  },
  getDoc: async ({ params }: any, c: any) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("docs")
        .leftJoin("user as u", "docs.cf_email", "u.email")
        .leftJoin("user_profiles as p", "u.id", "p.user_id")
        .select([
          "docs.slug",
          "docs.title",
          "docs.category",
          "docs.description",
          "docs.content",
          "docs.updated_at",
          "docs.is_portfolio",
          "docs.is_executive_summary",
          "p.nickname as original_author_nickname",
          "u.image as original_author_avatar"
        ])
        .where("docs.slug", "=", slug)
        .where("docs.is_deleted", "=", 0)
        .where("docs.status", "=", "published")
        .executeTakeFirst();

      if (!row) return { status: 404, body: { error: "Doc not found" } };

      const contributors = await db.selectFrom("docs_history as h")
        .leftJoin("user as u", "h.author_email", "u.email")
        .leftJoin("user_profiles as p", "u.id", "p.user_id")
        .select([
          "p.nickname",
          "u.image as avatar"
        ])
        .distinct()
        .where("h.slug", "=", slug)
        .where("h.author_email", "is not", null)
        .execute();

      return { status: 200, body: { doc: row as unknown, contributors: contributors as unknown[] } };
    } catch {
      return { status: 404, body: { error: "Database error" } };
    }
  },
  searchDocs: async ({ query }: any, c: any) => {
    const { q } = query;
    if (!q || q.length < 3) return { status: 200, body: { results: [] } };
    try {
      const now = Date.now();
      const cached = docSearchCache.get(q);
      if (cached && cached.expiresAt > now) return { status: 200, body: cached.data };

      const db = c.get("db");
      const results = await sql<Record<string, unknown>>`
        SELECT f.slug, f.title, f.category, f.description 
        FROM docs_fts f 
        JOIN docs d ON f.slug = d.slug 
        WHERE d.is_deleted = 0 AND d.status = 'published' AND f.docs_fts MATCH ${`"${q.replace(/"/g, '""')}"*`} 
        ORDER BY f.rank LIMIT 20
      `.execute(db);

      const mapped = (results.rows ?? []).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          slug: String(row.slug),
          title: String(row.title),
          category: String(row.category),
          description: String(row.description),
          // eslint-disable-next-line security/detect-non-literal-regexp
          snippet: String(row.description || "").replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"), "**$1**")
        };
      });

      const payload = { results: mapped };
      setCache(q, { data: payload, expiresAt: now + 60000 });
      return { status: 200, body: payload };
    } catch {
      return { status: 500, body: { error: "Search failed" } };
    }
  },
  adminList: async (_: any, c: any) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("docs")
        .select(["slug", "title", "category", "sort_order", "description", "is_portfolio", "is_executive_summary", "is_deleted", "status", "revision_of"])
        .orderBy("category")
        .orderBy("sort_order", "asc")
        .execute();
      return { status: 200, body: { docs: results as unknown[] } };
    } catch {
      return { status: 200, body: { docs: [] } };
    }
  },
  adminDetail: async ({ params }: any, c: any) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("docs")
        .select(["slug", "title", "category", "sort_order", "description", "content", "is_portfolio", "is_executive_summary", "is_deleted", "status", "revision_of"])
        .where("slug", "=", slug)
        .executeTakeFirst();
      if (!row) return { status: 404, body: { error: "Doc not found" } };
      return { status: 200, body: { doc: row as unknown } };
    } catch {
      return { status: 404, body: { error: "Database error" } };
    }
  },
  saveDoc: async ({ body }: any, c: any) => {
    try {
      const db = c.get("db");
      const { slug, title, category, sortOrder, description, content, isPortfolio, isExecutiveSummary, isDraft } = body;
      const user = await getSessionUser(c);
      const email = user?.email || "anonymous_admin";

      const existing = await db.selectFrom("docs")
        .select(["slug", "title", "category", "description", "content", "cf_email", "is_portfolio", "is_executive_summary"])
        .where("slug", "=", slug)
        .executeTakeFirst();
      
      if (existing) {
        await db.insertInto("docs_history")
          .values({
            slug: existing.slug,
            title: existing.title,
            category: existing.category,
            description: existing.description,
            content: existing.content,
            author_email: existing.cf_email || "unknown"
          })
          .execute();
        c.executionCtx.waitUntil(pruneDocHistory(c, slug, 10));
      }

      if (user?.role !== "admin" && existing) {
        const revSlug = `${slug}-rev-${Math.random().toString(36).substring(2, 6)}`;
        await db.insertInto("docs")
          .values({
            slug: revSlug,
            title,
            category,
            sort_order: sortOrder || 0,
            description: description || "",
            content,
            cf_email: email,
            updated_at: new Date().toISOString(),
            is_portfolio: isPortfolio ? 1 : 0,
            is_executive_summary: isExecutiveSummary ? 1 : 0,
            status: "pending",
            revision_of: slug
          })
          .execute();
        
        c.executionCtx.waitUntil(notifyByRole(c, ["admin", "coach", "mentor"], {
          title: "📝 Doc Revision Pending",
          message: `"${title}" revised by ${email} needs admin approval.`,
          link: "/dashboard",
          external: true,
          priority: "medium"
        }));
        return { status: 200, body: { success: true, slug: revSlug } };
      }

      const status = isDraft ? "pending" : (user?.role === "admin" ? "published" : "pending");
      
      // UPSERT equivalent in Kysely/SQLite
      await db.insertInto("docs")
        .values({
          slug,
          title,
          category,
          sort_order: sortOrder || 0,
          description: description || "",
          content,
          cf_email: email,
          updated_at: new Date().toISOString(),
          is_portfolio: isPortfolio ? 1 : 0,
          is_executive_summary: isExecutiveSummary ? 1 : 0,
          status
        })
        .onConflict((oc: any) => oc.column("slug").doUpdateSet({
          title,
          category,
          sort_order: sortOrder || 0,
          description: description || "",
          content,
          cf_email: email,
          updated_at: new Date().toISOString(),
          is_portfolio: isPortfolio ? 1 : 0,
          is_executive_summary: isExecutiveSummary ? 1 : 0,
          status
        }))
        .execute();

      if (status === "published") {
        const action = existing ? "updated" : "created";
        c.executionCtx.waitUntil(sendZulipMessage(c.env, "engineering", "Engineering Docs", `📝 **Doc ${action}:** [${title}](${siteConfig.urls.base}/docs/${slug}) (${category})`));
      }

      if (status === "pending") {
        c.executionCtx.waitUntil(notifyByRole(c, ["admin", "coach", "mentor"], {
          title: "📝 Pending Document",
          message: `"${title}" submitted by ${email} needs review.`,
          link: "/dashboard",
          external: true,
          priority: "medium"
        }));
      }

      return { status: 200, body: { success: true, slug } };
    } catch {
      return { status: 500, body: { error: "Write failed" } };
    }
  },
  updateSort: async ({ params, body }: any, c: any) => {
    const { slug } = params;
    const { sortOrder } = body;
    try {
      const db = c.get("db");
      await db.updateTable("docs").set({ sort_order: sortOrder }).where("slug", "=", slug).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  submitFeedback: async ({ params, body }: any, c: any) => {
    const { slug } = params;
    const { isHelpful, comment, turnstileToken } = body;
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    if (!checkRateLimit(`feedback:${ip}`, 10, 60)) return { status: 429, body: { error: "Too many submissions" } };

    const valid = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY, ip);
    if (!valid) return { status: 403, body: { error: "Security verification failed" } };

    if (comment && comment.length > 2000) return { status: 400, body: { error: "Comment too long" } };

    try {
      const db = c.get("db");
      await db.insertInto("docs_feedback").values({ slug, is_helpful: isHelpful ? 1 : 0, comment: comment || null }).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Feedback failed" } };
    }
  },
  getHistory: async ({ params }: any, c: any) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      const results = await db.selectFrom("docs_history")
        .select(["id", "title", "category", "description", "created_at"])
        .where("slug", "=", slug)
        .orderBy("created_at", "desc")
        .limit(50)
        .execute();
      return { status: 200, body: { history: results as unknown[] } };
    } catch {
      return { status: 200, body: { history: [] } };
    }
  },
  restoreHistory: async ({ params }: any, c: any) => {
    const { slug, id } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("docs_history").select(["title", "category", "description", "content"]).where("id", "=", Number(id)).where("slug", "=", slug).executeTakeFirst();
      if (!row) return { status: 404, body: { error: "Version not found" } };

      const user = await getSessionUser(c);
      const email = user?.email || "anonymous_admin";

      const current = await db.selectFrom("docs").select(["slug", "title", "category", "description", "content", "cf_email"]).where("slug", "=", slug).executeTakeFirst();
      if (current) {
        await db.insertInto("docs_history")
          .values({
            slug: current.slug,
            title: current.title,
            category: current.category,
            description: current.description,
            content: current.content,
            author_email: current.cf_email || "unknown"
          })
          .execute();
        c.executionCtx.waitUntil(pruneDocHistory(c, slug, 10));
      }

      await db.updateTable("docs").set({ title: row.title, category: row.category, description: row.description, content: row.content, cf_email: email, updated_at: new Date().toISOString() }).where("slug", "=", slug).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 404, body: { error: "Restore failed" } };
    }
  },
  approveDoc: async ({ params }: any, c: any) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("docs").select(["revision_of", "title", "category", "sort_order", "description", "content", "is_portfolio", "is_executive_summary", "cf_email"]).where("slug", "=", slug).executeTakeFirst();
      if (!row) return { status: 200, body: { success: false } };

      if (row.revision_of) {
        await db.updateTable("docs")
          .set({ title: row.title, category: row.category, sort_order: row.sort_order, description: row.description, content: row.content, is_portfolio: row.is_portfolio, is_executive_summary: row.is_executive_summary, status: "published", updated_at: new Date().toISOString() })
          .where("slug", "=", row.revision_of)
          .execute();
        await db.deleteFrom("docs").where("slug", "=", slug).execute();

        if (row.cf_email) {
          const author = await db.selectFrom("user").select("id").where("email", "=", row.cf_email).executeTakeFirst();
          if (author) await emitNotification(c, { userId: author.id, title: "Doc Merged", message: `Your changes to document "${row.title}" have been approved.`, link: `/docs/${row.revision_of}`, priority: "medium" });
        }
      } else {
        await db.updateTable("docs").set({ status: "published" }).where("slug", "=", slug).execute();
        if (row.cf_email) {
          const author = await db.selectFrom("user").select("id").where("email", "=", row.cf_email).executeTakeFirst();
          if (author) await emitNotification(c, { userId: author.id, title: "Doc Approved", message: `Your document "${row.title}" has been published.`, link: `/docs/${slug}`, priority: "medium" });
        }
      }
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  rejectDoc: async ({ params, body }: any, c: any) => {
    const { slug } = params;
    const { reason } = body;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("docs").select(["title", "cf_email"]).where("slug", "=", slug).executeTakeFirst();
      await db.updateTable("docs").set({ status: "rejected" }).where("slug", "=", slug).execute();
      if (row?.cf_email) {
        const author = await db.selectFrom("user").select("id").where("email", "=", row.cf_email).executeTakeFirst();
        if (author) await emitNotification(c, { userId: author.id, title: "Doc Rejected", message: `Your document "${row.title}" was rejected${reason ? `: "${reason}"` : "."}`, link: "/dashboard?tab=docs", priority: "high" });
      }
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  undeleteDoc: async ({ params }: any, c: any) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      await db.updateTable("docs").set({ is_deleted: 0, status: "draft" }).where("slug", "=", slug).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  purgeDoc: async ({ params }: any, c: any) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      await db.deleteFrom("docs").where("slug", "=", slug).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
};
const docTsRestRouter = s.router(docContract, docHandlers);
createHonoEndpoints(docContract, docTsRestRouter, docsRouter);

// Apply middleware/protections
docsRouter.use("/admin", ensureAdmin);
docsRouter.use("/admin/*", ensureAdmin);

// Special case: non-admins can submit drafts (handled inside saveDoc)
// We use ensureAuth for /admin/save specifically to allow verified members
docsRouter.use("/admin/save", ensureAuth);

export default docsRouter;
