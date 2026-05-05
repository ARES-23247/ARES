import { Hono } from "hono";
import { Context } from "hono";
import { Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { socialQueueContract } from "../../../shared/schemas/contracts/socialQueueContract";
import { AppEnv, getSessionUser, originIntegrityMiddleware } from "../middleware";
import { nanoid } from "nanoid";
import { dispatchQueuePost, SocialConfig } from "../../utils/socialSync";

initServer<AppEnv>();

interface SocialQueuePost {
  id: string;
  content: string;
  media_urls: string[] | null;
  scheduled_for: string;
  platforms: Record<string, boolean>;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  created_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_by: string | null;
  linked_type: "blog" | "event" | "document" | "asset" | null;
  linked_id: string | null;
  analytics: Record<string, unknown> | null;
}

const toSocialQueuePost = (r: Record<string, unknown>): SocialQueuePost => ({
  id: String(r.id),
  content: String(r.content),
  media_urls: r.media_urls ? JSON.parse(String(r.media_urls)) : null,
  scheduled_for: String(r.scheduled_for),
  platforms: JSON.parse(String(r.platforms)),
  analytics: r.analytics ? JSON.parse(String(r.analytics)) : null,
  status: r.status as SocialQueuePost["status"],
  linked_type: r.linked_type as SocialQueuePost["linked_type"],
  linked_id: r.linked_id as string | null,
  created_at: r.created_at as string | null,
  sent_at: r.sent_at as string | null,
  error_message: r.error_message as string | null,
  created_by: r.created_by as string | null,
});

const socialQueueRouterObj: any = {
  list: async (input: any, c: Context<AppEnv>) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const { query } = input;
      const { status = "all", limit = 20, offset = 0 } = query;
      const db = c.get("db") as Kysely<DB>;

      let queryBuilder = db.selectFrom("social_queue").selectAll();

      if (status !== "all") {
        queryBuilder = queryBuilder.where("status", "=", status as string);
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

  calendar: async (input: any, c: Context<AppEnv>) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const { query } = input;
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

  create: async (input: any, c: Context<AppEnv>) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const { body } = input;
      const db = c.get("db") as Kysely<DB>;

      const id = nanoid();
      const now = new Date().toISOString();

      const newPost = {
        id,
        content: body.content,
        media_urls: body.media_urls ? JSON.stringify(body.media_urls) : null,
        scheduled_for: body.scheduled_for,
        platforms: JSON.stringify(body.platforms),
        status: "pending" as const,
        created_at: now,
        sent_at: null,
        error_message: null,
        created_by: user.id,
        linked_type: (body.linked_type || null) as "blog" | "event" | "document" | "asset" | null,
        linked_id: (body.linked_id || null) as string | null,
        analytics: null,
      };

      await db.insertInto("social_queue").values(newPost).execute();

      const post: SocialQueuePost = {
        id,
        content: body.content,
        media_urls: body.media_urls || null,
        scheduled_for: body.scheduled_for,
        platforms: body.platforms,
        status: "pending",
        created_at: now,
        sent_at: null,
        error_message: null,
        created_by: user.id,
        linked_type: body.linked_type || null,
        linked_id: body.linked_id || null,
        analytics: null,
      };

      return { status: 200, body: { success: true, post } };
    } catch (error) {
      console.error("Social queue create error:", error);
      return { status: 500, body: { error: "Failed to create scheduled post" } };
    }
  },

  update: async (input: any, c: Context<AppEnv>) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const { params, body } = input;
      const { id } = params;
      const db = c.get("db") as Kysely<DB>;

      const existing = await db.selectFrom("social_queue").selectAll().where("id", "=", id).executeTakeFirst();

      if (!existing) {
        return { status: 404, body: { error: "Post not found" } };
      }

      if (existing.created_by !== user.id && user.role !== "admin") {
        return { status: 403, body: { error: "Forbidden" } };
      }

      if (existing.status === "processing" || existing.status === "sent") {
        return { status: 400, body: { error: "Cannot update posts that are processing or already sent" } };
      }

      const updateData: Record<string, unknown> = {};
      if (body.content !== undefined) updateData.content = body.content;
      if (body.media_urls !== undefined) updateData.media_urls = JSON.stringify(body.media_urls);
      if (body.scheduled_for !== undefined) updateData.scheduled_for = body.scheduled_for;
      if (body.platforms !== undefined) updateData.platforms = JSON.stringify(body.platforms);
      if (body.linked_type !== undefined) updateData.linked_type = body.linked_type;
      if (body.linked_id !== undefined) updateData.linked_id = body.linked_id;

      if (Object.keys(updateData).length > 0) {
        await db.updateTable("social_queue").set(updateData).where("id", "=", id).execute();
      }

      const updated = await db.selectFrom("social_queue").selectAll().where("id", "=", id).executeTakeFirst();

      if (!updated) {
        return { status: 404, body: { error: "Post not found" } };
      }

      const post = toSocialQueuePost(updated);

      return { status: 200, body: { success: true, post } };
    } catch (error) {
      console.error("Social queue update error:", error);
      return { status: 500, body: { error: "Failed to update scheduled post" } };
    }
  },

  delete: async (input: any, c: Context<AppEnv>) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const { params } = input;
      const { id } = params;
      const db = c.get("db") as Kysely<DB>;

      const existing = await db.selectFrom("social_queue").selectAll().where("id", "=", id).executeTakeFirst();

      if (!existing) {
        return { status: 404, body: { error: "Post not found" } };
      }

      if (existing.created_by !== user.id && user.role !== "admin") {
        return { status: 403, body: { error: "Forbidden" } };
      }

      await db.updateTable("social_queue").set({ status: "cancelled" }).where("id", "=", id).execute();

      return { status: 200, body: { success: true } };
    } catch (error) {
      console.error("Social queue delete error:", error);
      return { status: 500, body: { error: "Failed to cancel scheduled post" } };
    }
  },

  sendNow: async (input: any, c: Context<AppEnv>) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };

      const { params } = input;
      const { id } = params;
      const db = c.get("db") as Kysely<DB>;

      const existing = await db.selectFrom("social_queue").selectAll().where("id", "=", id).executeTakeFirst();

      if (!existing) {
        return { status: 404, body: { error: "Post not found" } };
      }

      if (existing.created_by !== user.id && user.role !== "admin") {
        return { status: 403, body: { error: "Forbidden" } };
      }

      await db.updateTable("social_queue").set({ status: "processing" }).where("id", "=", id).execute();

      try {
        const post = toSocialQueuePost(existing);
        const config = c.env as unknown as SocialConfig;

        await dispatchQueuePost(db, post, config);

        await db
          .updateTable("social_queue")
          .set({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
          .where("id", "=", id)
          .execute();
      } catch (err) {
        console.error("Social queue dispatch failed:", err);
        await db
          .updateTable("social_queue")
          .set({ status: "failed", error_message: String(err) })
          .where("id", "=", id)
          .execute();
        return { status: 500, body: { error: `Syndication failed: ${String(err)}` } };
      }

      return { status: 200, body: { success: true } };
    } catch (error) {
      console.error("Social queue send now error:", error);
      return { status: 500, body: { error: "Failed to send post" } };
    }
  },

  analytics: async (input: any, c: Context<AppEnv>) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return { status: 401, body: { error: "Unauthorized" } };
      if (user.role !== "admin") {
        return { status: 403, body: { error: "Forbidden" } };
      }

      const { query } = input;
      const { start, end } = query;
      const db = c.get("db") as Kysely<DB>;

      let queryBuilder = db.selectFrom("social_queue").selectAll();

      if (start) {
        queryBuilder = queryBuilder.where("scheduled_for", ">=", start);
      }
      if (end) {
        queryBuilder = queryBuilder.where("scheduled_for", "<=", end);
      }

      const results = await queryBuilder.execute();

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
