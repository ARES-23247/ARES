import { Hono } from "hono";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { sql, Kysely } from "kysely";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DB } from "../../../src/schemas/database";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { postContract } from "../../../src/schemas/contracts/postContract";
import { siteConfig } from "../../utils/site.config";
import { AppEnv, getSocialConfig, extractAstText, getSessionUser, ensureAdmin, ensureAuth, validateLength, MAX_INPUT_LENGTHS, logAuditAction } from "../middleware";
import { getStandardDate } from "../../utils/content";
import { dispatchSocials } from "../../utils/socialSync";
import { sendZulipMessage } from "../../utils/zulipSync";
import { emitNotification, notifyByRole } from "../../utils/notifications";
import { 
  approvePost, 
  getPostHistory, 
  restorePostFromHistory,
  createShadowRevision
} from "../../utils/postHistory";

const s = initServer<AppEnv>();
const postsRouter = new Hono<AppEnv>();

const postTsRestRouter = s.router(postContract, {
  getPosts: async ({ query }, c) => {
    try {
      const db = c.get("db");
      const { limit = 10, offset = 0, q } = query;

      const baseQuery = db.selectFrom("posts")
        .where("is_deleted", "=", 0)
        .where("status", "=", "published")
        .where((eb) => eb.or([
          eb("published_at", "is", null),
          eb("published_at", "<=", new Date().toISOString())
        ]));

      if (q) {
        const db = c.get("db");
        const results = await sql<{ slug: string, title: string, date: string, snippet: string, thumbnail: string, season_id: string | null, author_nickname: string | null, author_avatar: string | null }>`
          SELECT p.slug, p.title, p.date, p.snippet, p.thumbnail, p.season_id,
                  uP.nickname as author_nickname, u.image as author_avatar
           FROM posts_fts f
           JOIN posts p ON f.slug = p.slug
           LEFT JOIN user u ON p.cf_email = u.email
           LEFT JOIN user_profiles uP ON u.id = uP.user_id
           WHERE p.is_deleted = 0 AND p.status = 'published' AND (p.published_at IS NULL OR datetime(p.published_at) <= datetime('now')) 
           AND f.posts_fts MATCH ${q}
           ORDER BY f.rank LIMIT ${limit} OFFSET ${offset}
        `.execute(db);
        return { status: 200, body: { posts: results.rows } };
      }

      const results = await baseQuery
        .leftJoin("user as u", "posts.cf_email", "u.email")
        .leftJoin("user_profiles as uP", "u.id", "uP.user_id")
        .select([
          "posts.slug",
          "posts.title",
          "posts.date",
          "posts.snippet",
          "posts.thumbnail",
          "posts.season_id",
          "uP.nickname as author_nickname",
          "u.image as author_avatar"
        ])
        .orderBy("posts.date", "desc")
        .limit(limit)
        .offset(offset)
        .execute();

      return { status: 200, body: { posts: results } };
    } catch {
      return { status: 200, body: { posts: [] } };
    }
  },
  getPost: async ({ params }, c) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("posts")
        .leftJoin("user as u", "posts.cf_email", "u.email")
        .leftJoin("user_profiles as uP", "u.id", "uP.user_id")
        .select([
          "posts.slug",
          "posts.title",
          "posts.date",
          "posts.ast",
          "posts.thumbnail",
          "posts.season_id",
          "uP.nickname as author_nickname",
          "u.image as author_avatar"
        ])
        .where("posts.slug", "=", slug)
        .where("posts.is_deleted", "=", 0)
        .where("posts.status", "=", "published")
        .where((eb) => eb.or([
          eb("published_at", "is", null),
          eb("published_at", "<=", new Date().toISOString())
        ]))
        .executeTakeFirst();

      if (!row) return { status: 404, body: { error: "Post not found" } };
      return { status: 200, body: { post: row } };
    } catch {
      return { status: 404, body: { error: "Database error" } };
    }
  },
  getAdminPosts: async ({ query }, c) => {
    try {
      const db = c.get("db");
      const { limit = 50, offset = 0 } = query;
      const results = await db.selectFrom("posts")
        .select(["slug", "title", "date", "snippet", "thumbnail", "cf_email", "is_deleted", "status", "revision_of", "published_at", "season_id"])
        .orderBy("date", "desc")
        .limit(limit)
        .offset(offset)
        .execute();
      return { status: 200, body: { posts: results } };
    } catch {
      return { status: 200, body: { posts: [] } };
    }
  },
  getAdminPost: async ({ params }, c) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("posts")
        .select(["slug", "title", "date", "snippet", "thumbnail", "ast", "is_deleted", "status", "revision_of", "published_at", "season_id"])
        .where("slug", "=", slug)
        .executeTakeFirst();

      if (!row) return { status: 404, body: { error: "Post not found" } };
      return { status: 200, body: { post: row } };
    } catch {
      return { status: 404, body: { error: "Database error" } };
    }
  },
  savePost: async ({ body }, c) => {
    try {
      const db = c.get("db");
      const titleError = validateLength(body.title, MAX_INPUT_LENGTHS.title, "Title");
      if (titleError) return { status: 400, body: { error: titleError } };

      let slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const existing = await db.selectFrom("posts").select("slug").where("slug", "=", slug).executeTakeFirst();
      if (existing) {
        const suffix = Math.random().toString(36).substring(2, 6);
        slug = `${slug}-${suffix}`;
      }

      const dateStr = getStandardDate();
      const astStr = JSON.stringify(body.ast);
      const snippet = extractAstText(body.ast).substring(0, 200);
      
      const user = await getSessionUser(c);
      const email = user?.email || "anonymous_dashboard_user";
      const status = body.isDraft ? "pending" : (user?.role === "admin" ? "published" : "pending");

      await db.insertInto("posts")
        .values({
          slug,
          title: body.title,
          author: "ARES Team", // Fallback as Kysely needs it if not null
          date: dateStr,
          thumbnail: body.coverImageUrl || "",
          snippet,
          ast: astStr,
          cf_email: email,
          status,
          published_at: body.publishedAt || null,
          season_id: body.seasonId || null
        })
        .execute();

      c.executionCtx.waitUntil(logAuditAction(c, "CREATE_POST", "posts", slug, `Created post: ${body.title} (${status})`));

      const warnings: string[] = [];

      if (status === "published") {
        const socialConfig = await getSocialConfig(c);
        const socialsFilter = body.socials || null;
        const baseUrl = new URL(c.req.url).origin;

        try {
          await dispatchSocials(
            c.env.DB,
            {
              title: body.title,
              url: `${baseUrl}/blog/${slug}`,
              snippet: snippet || "Read the latest engineering update from ARES 23247!",
              coverImageUrl: body.coverImageUrl || "/gallery_1.png",
              baseUrl: baseUrl
            },
            socialConfig,
            socialsFilter
          );
        } catch (err) {
          console.error("Social dispatch failed:", err);
          warnings.push("Social Syndication Failed");
        }

        try {
          await sendZulipMessage(
            c.env,
            "announcements",
            "Website Updates",
            `🚀 **New Blog Post Published:** [${body.title}](${siteConfig.urls.base}/blog/${slug})\n\n${snippet.substring(0, 300)}`
          );
        } catch (err) {
          console.error("[Posts] Zulip announcement failed:", err);
          warnings.push("Zulip Notification Failed");
        }
      }

      if (status === "pending") {
        c.executionCtx.waitUntil(
          notifyByRole(c, ["admin", "coach", "mentor"], {
            title: "📝 Pending Blog Post",
            message: `"${body.title}" submitted by ${email} needs review.`,
            link: "/dashboard",
            external: true,
            priority: "medium"
          }).catch(() => {})
        );
      }

      return { 
        status: warnings.length > 0 ? 207 : 200, 
        body: { success: true, slug, warning: warnings.join(" | ") } 
      };
    } catch (err) {
      return { status: 500, body: { error: (err as Error)?.message || "Database write failed" } };
    }
  },
  updatePost: async ({ params, body }, c) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      const astStr = JSON.stringify(body.ast);
      const snippet = extractAstText(body.ast).substring(0, 200);
      const user = await getSessionUser(c);
      
      if (user?.role !== "admin") {
        const revSlug = await createShadowRevision(c, slug, user!, {
          title: body.title,
          author: "ARES Team",
          coverImageUrl: body.coverImageUrl,
          snippet,
          astStr,
          publishedAt: body.publishedAt,
          seasonId: body.seasonId
        });
        return { status: 200, body: { success: true, slug: revSlug } };
      }

      const status = body.isDraft ? "pending" : "published";
      await db.updateTable("posts")
        .set({
          title: body.title,
          thumbnail: body.coverImageUrl || "",
          snippet,
          ast: astStr,
          status,
          published_at: body.publishedAt || null,
          season_id: body.seasonId || null
        })
        .where("slug", "=", slug)
        .execute();

      c.executionCtx.waitUntil(logAuditAction(c, "UPDATE_POST", "posts", slug, `Updated post: ${body.title} (${status})`));
      return { status: 200, body: { success: true, slug } };
    } catch {
      return { status: 500, body: { error: "Database write failed" } };
    }
  },
  deletePost: async ({ params }, c) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      await db.updateTable("posts").set({ is_deleted: 1, status: "draft" }).where("slug", "=", slug).execute();
      c.executionCtx.waitUntil(logAuditAction(c, "DELETE_POST", "posts", slug));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  undeletePost: async ({ params }, c) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      await db.updateTable("posts").set({ is_deleted: 0, status: "draft" }).where("slug", "=", slug).execute();
      c.executionCtx.waitUntil(logAuditAction(c, "RESTORE_POST", "posts", slug));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  purgePost: async ({ params }, c) => {
    const { slug } = params;
    try {
      const db = c.get("db");
      await db.deleteFrom("posts").where("slug", "=", slug).execute();
      c.executionCtx.waitUntil(logAuditAction(c, "PURGE_POST", "posts", slug));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  approvePost: async ({ params }, c) => {
    const { slug } = params;
    try {
      const result = await approvePost(c, slug);
      if (!result.success) return { status: 404, body: { error: result.error || "Approval failed" } };
      return { status: 200, body: { success: true, warnings: result.warnings } };
    } catch {
      return { status: 404, body: { error: "Approval failed" } };
    }
  },
  rejectPost: async ({ params, body }, c) => {
    const { slug } = params;
    const { reason } = body;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("posts").select(["title", "cf_email"]).where("slug", "=", slug).executeTakeFirst();
      
      await db.updateTable("posts").set({ status: "rejected" }).where("slug", "=", slug).execute();

      if (row?.cf_email) {
        const author = await db.selectFrom("user").select("id").where("email", "=", row.cf_email).executeTakeFirst();
        if (author) {
          c.executionCtx.waitUntil(emitNotification(c, {
            userId: author.id,
            title: "Post Rejected",
            message: `Your post "${row.title}" was rejected${reason ? `: "${reason}"` : "."}`,
            link: "/dashboard?tab=posts",
            priority: "high"
          }));
        }
      }
      c.executionCtx.waitUntil(logAuditAction(c, "REJECT_POST", "posts", slug));
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 404, body: { error: "Reject failed" } };
    }
  },
  getPostHistory: async ({ params }, c) => {
    const { slug } = params;
    try {
      const history = await getPostHistory(c, slug);
      return { status: 200, body: { history: history } };
    } catch {
      return { status: 200, body: { history: [] } };
    }
  },
  restorePostHistory: async ({ params }, c) => {
    const { slug, id } = params;
    const user = await getSessionUser(c);
    const result = await restorePostFromHistory(c, slug, id, user?.email || "anonymous_admin");
    if (!result.success) return { status: 404, body: { error: result.error || "Restore failed" } };
    return { status: 200, body: { success: true } };
  },
  repushSocials: async ({ params, body }, c) => {
    const { slug } = params;
    const { socials } = body;
    try {
      const db = c.get("db");
      const post = await db.selectFrom("posts").select(["title", "snippet", "thumbnail"]).where("slug", "=", slug).executeTakeFirst();
      if (!post) return { status: 404, body: { error: "Post not found" } };

      const socialConfig = await getSocialConfig(c);
      const baseUrl = new URL(c.req.url).origin;
      
      await dispatchSocials(
        c.env.DB,
        {
          title: post.title,
          url: `${baseUrl}/blog/${slug}`,
          snippet: extractAstText(post.snippet || "").substring(0, 250) || "Read the latest update from ARES 23247!",
          coverImageUrl: post.thumbnail || "",
          baseUrl: baseUrl
        }, socialConfig, socials);
      return { status: 200, body: { success: true } };
    } catch (err) {
      return { status: 502, body: { error: (err as Error).message } };
    }
  },
});

createHonoEndpoints(postContract, postTsRestRouter, postsRouter);

// Apply middleware/protections
postsRouter.use("/admin", ensureAdmin);
postsRouter.use("/admin/*", ensureAdmin);

// Special case: non-admins can submit drafts (handled inside savePost)
// We use ensureAuth for /admin/save specifically to allow verified members
postsRouter.use("/admin/save", ensureAuth);

export default postsRouter;
