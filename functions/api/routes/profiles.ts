import { Hono } from "hono";
import { AppEnv, getSessionUser, sanitizeProfileForPublic, rateLimitMiddleware } from "../middleware";
import { getAuth } from "../../utils/auth";
import { decrypt } from "../../utils/crypto";
import { upsertProfile } from "./_profileUtils";
import { sql } from "kysely";


const profilesRouter = new Hono<AppEnv>();

// ── GET /me — fetch current user's full profile ───────────────
profilesRouter.get("/me", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = c.get("db");

  try {
    const profile = await db.selectFrom("user_profiles as p")
      .innerJoin("user as u", "p.user_id", "u.id")
      .selectAll("p")
      .select("u.image as avatar")
      .where("p.user_id", "=", user.id)
      .executeTakeFirst();

    const rawBadges = await db.selectFrom("badges as b")
      .innerJoin("user_badges as ub", "b.id", "ub.badge_id")
      .selectAll("b")
      .where("ub.user_id", "=", user.id)
      .orderBy("ub.awarded_at", "desc")
      .execute();

    // Decrypt PII fields
    if (profile) {
      const secret = c.env.ENCRYPTION_SECRET;
      const p = profile as Record<string, unknown>;
      p.emergency_contact_name = await decrypt(p.emergency_contact_name as string, secret);
      p.emergency_contact_phone = await decrypt(p.emergency_contact_phone as string, secret);
      p.phone = await decrypt(p.phone as string, secret);
      p.contact_email = await decrypt(p.contact_email as string, secret);
      p.parents_name = await decrypt(p.parents_name as string, secret);
      p.parents_email = await decrypt(p.parents_email as string, secret);
      p.students_name = await decrypt(p.students_name as string, secret);
      p.students_email = await decrypt(p.students_email as string, secret);
    }


    return c.json({
      ...(profile || {
        user_id: user.id,
        nickname: user.name || "",
        avatar: null,
        member_type: "student",
      }),
      badges: rawBadges || [],
      auth: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role },
    });
  } catch {
    return c.json({ error: "Profile fetch failed" }, 500);
  }
});

// ── PUT /me — update current user's profile ──────────────────
profilesRouter.put("/me", rateLimitMiddleware(15, 60), async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json();
    await upsertProfile(c, user.id, body);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Profile update failed" }, 500);
  }
});

// ── PUT /avatar — update avatar image ─────────────────────────
profilesRouter.put("/avatar", rateLimitMiddleware(15, 60), async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json();
    const { image } = body;

    const auth = getAuth(c.env.DB, c.env, c.req.url);
    await auth.api.updateUser({ 
      headers: c.req.raw.headers,
      body: { image: image || null }
    });

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Avatar update failed" }, 500);
  }
});

// ── GET /team-roster — about page roster ──────────────────────────────
profilesRouter.get("/team-roster", rateLimitMiddleware(10, 60), async (c) => {
  const db = c.get("db");
  try {
    const q = c.req.query("q") || "";
    
    const query = db.selectFrom("user_profiles as p")
      .innerJoin("user as u", "p.user_id", "u.id")
      .where("p.show_on_about", "=", 1)
      .where("u.role", "!=", "unverified");

    if (q) {
      // Fallback for FTS5 which Kysely doesn't handle natively well without raw
      const db = c.get("db");
      const results = await sql<Record<string, unknown>>`
        SELECT p.user_id, p.nickname, p.bio, p.pronouns, p.subteams, p.member_type,
                p.favorite_first_thing, p.fun_fact, p.show_email, p.contact_email,
                p.favorite_robot_mechanism, p.pre_match_superstition, p.leadership_role,
                p.rookie_year, p.colleges, p.employers,
                u.image as avatar, u.name
         FROM user_profiles_fts f
         JOIN user_profiles p ON f.user_id = p.user_id
         JOIN user u ON p.user_id = u.id
         WHERE p.show_on_about = 1 AND u.role NOT IN ('unverified') AND f.user_profiles_fts MATCH ${`"${q.replace(/"/g, '""')}"*`} 
         ORDER BY f.rank
      `.execute(db);
      
      const sanitized = await Promise.all((results.rows || []).map(async (r) => {
        const row = r as Record<string, unknown>;
        const memberType = String(row.member_type || "student");
        if (row.contact_email && (memberType === "mentor" || memberType === "coach")) {
          row.contact_email = await decrypt(row.contact_email as string, c.env.ENCRYPTION_SECRET);
        }
        return sanitizeProfileForPublic(row, memberType);
      }));
      return c.json({ members: sanitized });
    }

    const results = await query
      .select([
        "p.user_id", "p.nickname", "p.bio", "p.pronouns", "p.subteams", "p.member_type",
        "p.favorite_first_thing", "p.fun_fact", "p.show_email", "p.contact_email",
        "p.favorite_robot_mechanism", "p.pre_match_superstition", "p.leadership_role",
        "p.rookie_year", "p.colleges", "p.employers",
        "u.image as avatar", "u.name"
      ])
      .execute();

    const sanitized = await Promise.all((results || []).map(async (r) => {
      const row = r as Record<string, unknown>;
      const memberType = String(row.member_type || "student");
      if (row.contact_email && (memberType === "mentor" || memberType === "coach")) {
        row.contact_email = await decrypt(row.contact_email as string, c.env.ENCRYPTION_SECRET);
      }
      return sanitizeProfileForPublic(row, memberType);
    }));

    return c.json({ members: sanitized });
  } catch {
    return c.json({ members: [] });
  }
});

// ── GET /:userId — public profile ─────────────────────────────
profilesRouter.get("/:userId", async (c) => {
  const userId = (c.req.param("userId") || "");
  const db = c.get("db");
  try {
    const profile = await db.selectFrom("user_profiles as p")
      .leftJoin("user as u", "p.user_id", "u.id")
      .select([
        "p.user_id", "p.nickname", "p.bio", "p.pronouns", "p.subteams", "p.member_type",
        "p.favorite_first_thing", "p.fun_fact", "p.show_email", "p.contact_email",
        "p.show_phone", "p.phone", "p.show_on_about",
        "p.favorite_robot_mechanism", "p.pre_match_superstition", "p.leadership_role",
        "p.rookie_year", "p.colleges", "p.employers", "p.grade_year",
        "u.image as avatar", "u.name"
      ])
      .where("p.user_id", "=", userId)
      .executeTakeFirst();

    if (!profile) return c.json({ error: "Profile not found" }, 404);
    if (Number(profile.show_on_about || 0) !== 1) return c.json({ error: "This profile is private." }, 403);

    const memberType = String(profile.member_type || "student");
    const sanitized = sanitizeProfileForPublic(profile as unknown as Record<string, unknown>, memberType) as Record<string, unknown>;

    const requester = await getSessionUser(c);
    const isAdmin = requester?.role === "admin" || requester?.role === "author" || requester?.member_type === "coach" || requester?.member_type === "mentor";
    const isSelf = requester?.id === userId;

    if (isAdmin || isSelf) {
      const sensitive = await db.selectFrom("user_profiles")
        .select(["emergency_contact_name", "emergency_contact_phone", "dietary_restrictions", "tshirt_size", "phone", "contact_email", "parents_name", "parents_email", "students_name", "students_email"])
        .where("user_id", "=", userId)
        .executeTakeFirst();

      if (sensitive) {
        const secret = c.env.ENCRYPTION_SECRET;
        sanitized.emergency_contact_name = await decrypt(sensitive.emergency_contact_name as string, secret);
        sanitized.emergency_contact_phone = await decrypt(sensitive.emergency_contact_phone as string, secret);
        sanitized.dietary_restrictions = sensitive.dietary_restrictions;
        sanitized.tshirt_size = sensitive.tshirt_size;
        sanitized.phone = await decrypt(sensitive.phone as string, secret);
        sanitized.contact_email = await decrypt(sensitive.contact_email as string, secret);
        sanitized.parents_name = await decrypt(sensitive.parents_name as string, secret);
        sanitized.parents_email = await decrypt(sensitive.parents_email as string, secret);
        sanitized.students_name = await decrypt(sensitive.students_name as string, secret);
        sanitized.students_email = await decrypt(sensitive.students_email as string, secret);
      }
    }

    const rawBadges = await db.selectFrom("badges as b")
      .innerJoin("user_badges as ub", "b.id", "ub.badge_id")
      .selectAll("b")
      .where("ub.user_id", "=", userId)
      .orderBy("ub.awarded_at", "desc")
      .execute();

    return c.json({ profile: sanitized, badges: rawBadges || [] });
  } catch {
    return c.json({ error: "Profile fetch failed" }, 500);
  }
});

export default profilesRouter;

