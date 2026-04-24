import { Hono } from "hono";
import { Kysely } from "kysely";
import { DB } from "../../../src/schemas/database";
import { AppEnv, getSessionUser, MAX_INPUT_LENGTHS, getSocialConfig, turnstileMiddleware, rateLimitMiddleware } from "../middleware";
import { sendZulipMessage, updateZulipMessage, deleteZulipMessage } from "../../utils/zulipSync";
import { emitNotification } from "../../utils/notifications";


const commentsRouter = new Hono<AppEnv>();

// ── GET /comments/:targetType/:targetId — list comments ────────────────
commentsRouter.get("/:targetType/:targetId", async (c) => {
  const targetType = (c.req.param("targetType") || "");
  const targetId = (c.req.param("targetId") || "");
  const user = await getSessionUser(c);
  const db = c.get("db") as Kysely<DB>;

  try {
    const results = await db.selectFrom("comments as c")
      .innerJoin("user_profiles as p", "c.user_id", "p.user_id")
      .innerJoin("user as u", "c.user_id", "u.id")
      .selectAll("c")
      .select(["p.nickname", "u.image as avatar"])
      .where("c.target_type", "=", targetType)
      .where("c.target_id", "=", targetId)
      .where("c.is_deleted", "=", 0)
      .orderBy("c.created_at", "asc")
      .execute();

    const mapped = (results || []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id as string,
        content: row.content as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        user_id: row.user_id as string,
        nickname: (row.nickname as string) || "ARES Member",
        avatar: row.avatar as string | undefined,
        is_own: user ? user.id === row.user_id : false,
      };
    });

    return c.json({ 
      comments: mapped,
      authenticated: !!user,
      can_comment: user && user.role !== "unverified"
    });
  } catch {
    return c.json({ comments: [] }, 500);
  }
});

// ── POST /comments/:targetType/:targetId — create a comment ───────────
commentsRouter.post("/:targetType/:targetId", rateLimitMiddleware(10, 60), turnstileMiddleware(), async (c) => {
  const user = await getSessionUser(c);
  if (!user || user.role === "unverified") {
    return c.json({ error: "Forbidden: Your account is pending team verification." }, 403);
  }

  const targetType = (c.req.param("targetType") || "");
  const targetId = (c.req.param("targetId") || "");
  const db = c.get("db") as Kysely<DB>;

  let body: { content?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request payload" }, 400);
  }
  const content = (body.content || "").trim();

  if (!content) return c.json({ error: "Comment content cannot be empty" }, 400);
  if (content.length > MAX_INPUT_LENGTHS.comment) return c.json({ error: "Comment too long" }, 400);

  try {
    const id = crypto.randomUUID();
    await db.insertInto("comments")
      .values({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: id as any,
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        content,
        created_at: new Date().toISOString()
      })
      .execute();

    // ── Sync to Zulip ──
    const social = await getSocialConfig(c);
    const zulipStream = social.ZULIP_COMMENT_STREAM || "website-discussion";
    
    c.executionCtx.waitUntil((async () => {
       const msgId = await sendZulipMessage(
         c.env, 
         zulipStream, 
         `${targetType.toUpperCase()}: ${targetId}`, 
         `**${user.nickname || 'ARES Member'}** commented on ${targetType} \`${targetId}\`:\n\n${content}`
       );
        if (msgId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await db.updateTable("comments").set({ zulip_message_id: Number(msgId) }).where("id", "=", id as any).execute();
        }
    })().catch(() => {}));

    // ── Notifications ──
    if (targetType === 'post') {
       const row = await db.selectFrom("posts").select("cf_email").where("slug", "=", targetId).executeTakeFirst();
       if (row?.cf_email && row.cf_email !== user.email) {
          const author = await db.selectFrom("user").select("id").where("email", "=", row.cf_email).executeTakeFirst();
          if (author) {
            c.executionCtx.waitUntil(emitNotification(c, {
               userId: author.id,
               title: "New Comment",
               message: `${user.nickname || 'Someone'} commented on your post "${targetId}"`,
               link: `/blog/${targetId}`,
               priority: "medium"
            }));
          }
       }
    }

    return c.json({ success: true, id });
  } catch {
    return c.json({ error: "Comment creation failed" }, 500);
  }
});

// ── PUT /comments/:id — edit a comment ──────────────────────────────────
commentsRouter.put("/:id", rateLimitMiddleware(10, 60), async (c) => {
  const user = await getSessionUser(c);
  if (!user || user.role === "unverified") return c.json({ error: "Forbidden" }, 403);

  const id = (c.req.param("id") || "");
  const db = c.get("db") as Kysely<DB>;

  let body: { content?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request payload" }, 400);
  }
  const content = (body.content || "").trim();

  if (!content) return c.json({ error: "Comment content cannot be empty" }, 400);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await db.selectFrom("comments").select(["user_id", "zulip_message_id"]).where("id", "=", id as any).executeTakeFirst();
    if (!row) return c.json({ error: "Comment not found" }, 404);
    if (row.user_id !== user.id && user.role !== "admin") return c.json({ error: "Forbidden" }, 403);

    await db.updateTable("comments")
      .set({ content, updated_at: new Date().toISOString() })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .where("id", "=", id as any)
      .execute();

    if (row.zulip_message_id) {
       c.executionCtx.waitUntil(
         updateZulipMessage(c.env, String(row.zulip_message_id), `**${user.name}** (edited):\n\n${content}`)
           .catch(() => {})
       );
    }

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Update failed" }, 500);
  }
});

// ── DELETE /comments/:id — delete a comment ──────────────────────────────
commentsRouter.delete("/:id", async (c) => {
  const user = await getSessionUser(c);
  if (!user || user.role === "unverified") return c.json({ error: "Forbidden" }, 403);

  const id = (c.req.param("id") || "");
  const db = c.get("db") as Kysely<DB>;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await db.selectFrom("comments").select(["user_id", "zulip_message_id"]).where("id", "=", id as any).executeTakeFirst();
    if (!row) return c.json({ error: "Comment not found" }, 404);
    if (row.user_id !== user.id && user.role !== "admin") return c.json({ error: "Forbidden" }, 403);

    await db.updateTable("comments")
      .set({ is_deleted: 1 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .where("id", "=", id as any)
      .execute();

    if (row.zulip_message_id) {
       c.executionCtx.waitUntil(
         deleteZulipMessage(c.env, String(row.zulip_message_id))
           .catch(() => {})
       );
    }

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Delete failed" }, 500);
  }
});

export default commentsRouter;
