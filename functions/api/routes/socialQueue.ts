import { Hono } from "hono";
import { Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { RecursiveRouterObj } from "ts-rest-hono";
import { socialQueueContract, SocialQueuePost } from "../../../shared/schemas/contracts/socialQueueContract";
import { AppEnv, getSessionUser } from "../middleware";
import { nanoid } from "nanoid";
import { dispatchQueuePost, SocialConfig } from "../../utils/socialSync";

initServer<AppEnv>();

const toSocialQueuePost = (r: Record<string, unknown>): SocialQueuePost => ({
  id: String(r.id),
  content: String(r.content),
  media_urls: r.media_urls ? JSON.parse(String(r.media_urls)) : undefined,
  scheduled_for: String(r.scheduled_for),
  platforms: JSON.parse(String(r.platforms)),
  analytics: r.analytics ? JSON.parse(String(r.analytics)) : null,
  status: r.status as SocialQueuePost["status"],
  linked_type: (r.linked_type as SocialQueuePost["linked_type"]) || null,
  linked_id: (r.linked_id as string) || null,
  created_at: r.created_at ? String(r.created_at) : new Date().toISOString(),
  sent_at: (r.sent_at as string) || null,
  error_message: (r.error_message as string) || null,
  created_by: (r.created_by as string) || null,
});

const socialQueueRouterObj: RecursiveRouterObj<typeof socialQueueContract, AppEnv> = {
  list: async ({ query }, c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const { status = "all", limit = 20, offset = 0 } = query;
      const db = c.get("db") as Kysely<DB>;

      let queryBuilder = db.selectFrom("social_queue").selectAll();

      if (status !== "all") {
        queryBuilder = queryBuilder.where("status", "=", status as any);
      }

      if (user.role !== "admin") {
        queryBuilder = queryBuilder.where("created_by", "=", user.id);
      }

      const totalResult = await queryBuilder
        .select((eb) => eb.fn.count("id").as("count"))
        .execute();

      const total = Number(totalResult[0].count);

      const results = await queryBuilder
        .orderBy("scheduled_for", "desc")
        .limit(Number(limit))
        .offset(Number(offset))
        .execute();

      const posts: SocialQueuePost[] = results.map(toSocialQueuePost);

      return { status: 200, body: { posts, total } };
    } catch (error) {
      console.error("Social queue list error:", error);
      return { status: 500, body: { error: "Failed to fetch scheduled posts" } };
    }
  },

  calendar: async ({ query }, c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const { start, end } = query;
      const db = c.get("db") as Kysely<DB>;

      let queryBuilder = db
        .selectFrom("social_queue")
        .selectAll()
        .where("scheduled_for", ">=", start)
        .where("scheduled_for", "<=", end);

      if (user.role !== "admin") {
        queryBuilder = queryBuilder.where("created_by", "=", user.id);
      }

      const results = await queryBuilder.orderBy("scheduled_for", "asc").execute();

      const posts: SocialQueuePost[] = results.map(toSocialQueuePost);

      return { status: 200, body: { posts } };
    } catch (error) {
      console.error("Social queue calendar error:", error);
      return { status: 500, body: { error: "Failed to fetch calendar posts" } };
    }
  },

  create: async ({ body }, c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const db = c.get("db") as Kysely<DB>;
      const id = nanoid();
      const createdAt = new Date().toISOString();

      const newPost = {
        id,
        content: body.content,
        platforms: JSON.stringify(body.platforms),
        media_urls: body.media_urls ? JSON.stringify(body.media_urls) : null,
        scheduled_for: body.scheduled_for,
        status: "pending",
        created_at: createdAt,
        created_by: user.id,
        linked_type: body.linked_type || null,
        linked_id: body.linked_id || null,
      };

      await db.insertInto("social_queue").values(newPost as any).execute();

      const post: SocialQueuePost = {
        ...body,
        id,
        status: "pending",
        created_at: createdAt,
        created_by: user.id,
        sent_at: null,
        error_message: null,
        analytics: null,
        media_urls: body.media_urls || [],
        linked_type: body.linked_type || null,
        linked_id: body.linked_id || null,
      };

      return { status: 200, body: { success: true, post } };
    } catch (error) {
      console.error("Social queue create error:", error);
      return { status: 500, body: { error: "Failed to schedule post" } };
    }
  },

  update: async ({ params, body }, c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const db = c.get("db") as Kysely<DB>;
      const { id } = params;

      const existing = await db
        .selectFrom("social_queue")
        .where("id", "=", id)
        .executeTakeFirst();

      if (!existing) return { status: 500, body: { error: "Post not found" } };
      if (user.role !== "admin" && existing.created_by !== user.id) {
        return { status: 401, body: { error: "Unauthorized" } };
      }

      const updates: any = { ...body };
      if (body.platforms) updates.platforms = JSON.stringify(body.platforms);
      if (body.media_urls) updates.media_urls = JSON.stringify(body.media_urls);

      await db.updateTable("social_queue").set(updates).where("id", "=", id).execute();

      const updated = await db
        .selectFrom("social_queue")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirstOrThrow();

      return { status: 200, body: { success: true, post: toSocialQueuePost(updated as any) } };
    } catch (error) {
      console.error("Social queue update error:", error);
      return { status: 500, body: { error: "Failed to update post" } };
    }
  },

  delete: async ({ params }, c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const db = c.get("db") as Kysely<DB>;
      const { id } = params;

      const existing = await db
        .selectFrom("social_queue")
        .where("id", "=", id)
        .executeTakeFirst();

      if (!existing) return { status: 500, body: { error: "Post not found" } };
      if (user.role !== "admin" && existing.created_by !== user.id) {
        return { status: 401, body: { error: "Unauthorized" } };
      }

      await db.deleteFrom("social_queue").where("id", "=", id).execute();

      return { status: 200, body: { success: true } };
    } catch (error) {
      console.error("Social queue delete error:", error);
      return { status: 500, body: { error: "Failed to delete post" } };
    }
  },

  sendNow: async ({ params }, c) => {
    try {
      const user = await getSessionUser(c);
      if (!user || user.role !== "admin") {
        return { status: 401, body: { error: "Unauthorized" } };
      }

      const db = c.get("db") as Kysely<DB>;
      const { id } = params;

      const record = await db
        .selectFrom("social_queue")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();

      if (!record) return { status: 500, body: { error: "Post not found" } };

      const post = toSocialQueuePost(record as any);
      const config: SocialConfig = {
        twitter: !!c.env.TWITTER_API_KEY,
        bluesky: !!c.env.BLUESKY_HANDLE,
        facebook: !!c.env.FACEBOOK_ACCESS_TOKEN,
        instagram: !!c.env.INSTAGRAM_ACCESS_TOKEN,
        discord: !!c.env.DISCORD_WEBHOOK_URL,
        slack: !!c.env.SLACK_WEBHOOK_URL,
        linkedin: !!c.env.LINKEDIN_ACCESS_TOKEN,
      };

      await dispatchQueuePost(db, post, config);

      return { status: 200, body: { success: true } };
    } catch (error) {
      console.error("Social queue sendNow error:", error);
      return { status: 500, body: { error: "Failed to send post" } };
    }
  },

  analytics: async ({ query }, c) => {
    try {
      const user = await getSessionUser(c);
      if (!user || user.role !== "admin") {
        return { status: 401, body: { error: "Unauthorized" } };
      }

      const { start, end } = query;
      const db = c.get("db") as Kysely<DB>;

      let q = db.selectFrom("social_queue");
      if (start) q = q.where("scheduled_for", ">=", start);
      if (end) q = q.where("scheduled_for", "<=", end);

      const results = await q.selectAll().execute();

      const total_posts = results.length;
      const total_sent = results.filter((r) => r.status === "sent").length;
      const total_pending = results.filter((r) => r.status === "pending").length;
      const total_failed = results.filter((r) => r.status === "failed").length;

      const by_platform = {
        twitter: 0,
        bluesky: 0,
        facebook: 0,
        instagram: 0,
        discord: 0,
        slack: 0,
        teams: 0,
        gchat: 0,
        linkedin: 0,
        tiktok: 0,
        band: 0,
      };

      results.forEach((r) => {
        const platforms = JSON.parse(String(r.platforms));
        Object.entries(platforms).forEach(([key, value]) => {
          if (value && key in by_platform) {
            (by_platform as Record<string, number>)[key]++;
          }
        });
      });

      return {
        status: 200,
        body: {
          total_posts,
          total_sent,
          total_pending,
          total_failed,
          by_platform,
          engagement: {
            total_impressions: 0,
            total_likes: 0,
            total_shares: 0,
            total_comments: 0,
          },
        },
      };
    } catch (error) {
      console.error("Social queue analytics error:", error);
      return { status: 500, body: { error: "Failed to fetch analytics" } };
    }
  },
};

const socialQueueRouter = new Hono<AppEnv>();

// WR-11: Add origin integrity to prevent CSRF attacks on social queue operations
socialQueueRouter.use("*", originIntegrityMiddleware());

createHonoEndpoints(socialQueueContract, socialQueueRouterObj, socialQueueRouter);

export default socialQueueRouter;
