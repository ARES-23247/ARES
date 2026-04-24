import { AppEnv, getSocialConfig, getSessionUser, getDbSettings, logAuditAction } from "../../middleware";
import { pushEventToGcal, pullEventsFromGcal } from "../../../utils/gcalSync";
import { dispatchSocials, SocialConfig } from "../../../utils/socialSync";
import { sendZulipMessage } from "../../../utils/zulipSync";
import { Context } from "hono";
import { sql } from "kysely";

export const eventHandlers: Record<string, unknown> = {
  getEvents: async ({ query }, c: Context<AppEnv>) => {
    try {
      const db = c.get("db");
      const { limit = 50, offset = 0, q } = query;

      if (q) {
        const results = await sql<Record<string, unknown>>`
          SELECT e.id, e.title, e.category, e.date_start, e.date_end, e.location, e.description, e.cover_image, e.tba_event_key, e.gcal_event_id, e.cf_email, e.is_potluck, e.is_volunteer, e.published_at 
           FROM events_fts f
           JOIN events e ON f.id = e.id
           WHERE e.is_deleted = 0 AND e.status = 'published' AND (e.published_at IS NULL OR datetime(e.published_at) <= datetime('now'))
           AND f.events_fts MATCH ${q}
           ORDER BY f.rank LIMIT ${limit} OFFSET ${offset}
        `.execute(db);
        return { status: 200, body: { events: results.rows ?? [] } };
      }

      const results = await db.selectFrom("events")
        .select(["id", "title", "category", "date_start", "date_end", "location", "description", "cover_image", "tba_event_key", "gcal_event_id", "cf_email", "is_potluck", "is_volunteer", "published_at"])
        .where("is_deleted", "=", 0)
        .where("status", "=", "published")
        .where((eb) => eb.or([
          eb("published_at", "is", null),
          eb("published_at", "<=", new Date().toISOString())
        ]))
        .orderBy("date_start", "desc")
        .limit(limit)
        .offset(offset)
        .execute();

      return { status: 200, body: { events: results as unknown[] } };
    } catch {
      return { status: 200, body: { events: [] } };
    }
  },
  getCalendarSettings: async (_, c: Context<AppEnv>) => {
    try {
      const db = c.get("db");
      const results = await db.selectFrom("settings")
        .select(["key", "value"])
        .where("key", "in", ["CALENDAR_ID", "CALENDAR_ID_INTERNAL", "CALENDAR_ID_OUTREACH", "CALENDAR_ID_EXTERNAL"])
        .execute();
      const map = results.reduce((acc: Record<string, unknown>, row) => ({ ...acc, [row.key as string]: row.value }), {});
      return { status: 200, body: { 
        calendarIdInternal: (map['CALENDAR_ID_INTERNAL'] as string) || (map['CALENDAR_ID'] as string) || "",
        calendarIdOutreach: (map['CALENDAR_ID_OUTREACH'] as string) || "",
        calendarIdExternal: (map['CALENDAR_ID_EXTERNAL'] as string) || "",
      }};
    } catch {
      return { status: 500, body: { error: "Database error" } };
    }
  },
  getEvent: async ({ params }, c: Context<AppEnv>) => {
    const { id } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("events")
        .leftJoin("user as u", "events.cf_email", "u.email")
        .leftJoin("user_profiles as p", "u.id", "p.user_id")
        .select([
          "events.id", "events.title", "events.category", "events.date_start", "events.date_end", "events.location", "events.description", "events.cover_image", "events.gcal_event_id", "events.cf_email", "events.is_potluck", "events.is_volunteer", "events.published_at",
          "p.nickname as author_nickname", "u.image as author_avatar"
        ])
        .where("events.id", "=", id)
        .where("events.is_deleted", "=", 0)
        .where("events.status", "=", "published")
        .executeTakeFirst();

      if (!row) return { status: 404, body: { error: "Event not found" } };
      return { status: 200, body: { event: row as unknown } };
    } catch {
      return { status: 500, body: { error: "Database error" } };
    }
  },
  getAdminEvents: async ({ query }, c: Context<AppEnv>) => {
    try {
      const db = c.get("db");
      const { limit = 100, offset = 0 } = query;
      const results = await db.selectFrom("events")
        .selectAll()
        .orderBy("date_start", "desc")
        .limit(limit)
        .offset(offset)
        .execute();
      
      const lastSyncRow = await db.selectFrom("settings").select("value").where("key", "=", "LAST_CALENDAR_SYNC").executeTakeFirst();
      return { status: 200, body: { events: results as unknown[], lastSyncedAt: lastSyncRow?.value || null } };
    } catch {
      return { status: 500, body: { error: "Failed to fetch events" } };
    }
  },
  adminDetail: async ({ params }, c: Context<AppEnv>) => {
    const { id } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("events").selectAll().where("id", "=", id).executeTakeFirst();
      if (!row) return { status: 404, body: { error: "Event not found" } };
      return { status: 200, body: { event: row as unknown } };
    } catch {
      return { status: 500, body: { error: "Database error" } };
    }
  },
  saveEvent: async ({ body }, c: Context<AppEnv>) => {
    try {
      const db = c.get("db");
      const { title, category, dateStart, dateEnd, location, description, coverImage, socials, isPotluck, isVolunteer, isDraft, publishedAt, seasonId } = body;
      const cat = category || 'internal';
      const genId = crypto.randomUUID();
      
      const socialConfig = await getSocialConfig(c) as unknown as SocialConfig;
      const calKey = `CALENDAR_ID_${cat.toUpperCase()}` as keyof SocialConfig;
      const calId = socialConfig[calKey] || socialConfig["CALENDAR_ID"];
      
      let gcalId = null;
      if (socialConfig["GCAL_SERVICE_ACCOUNT_EMAIL"] && socialConfig["GCAL_PRIVATE_KEY"] && calId) {
        try {
          gcalId = await pushEventToGcal(
            { id: genId, title, date_start: dateStart, date_end: dateEnd || undefined, location: location || undefined, description: description || undefined, cover_image: coverImage || undefined },
            { email: socialConfig["GCAL_SERVICE_ACCOUNT_EMAIL"] as string, privateKey: socialConfig["GCAL_PRIVATE_KEY"] as string, calendarId: calId as string }
          );
        } catch { /* ignore GCal failure */ void 0; }
      }

      const user = await getSessionUser(c);
      const status = isDraft ? "pending" : (user?.role === "admin" ? "published" : "pending");

      await db.insertInto("events")
        .values({
          id: genId, title, category: cat, date_start: dateStart, date_end: dateEnd || null,
          location: location || "", description: description || "", cover_image: coverImage || "",
          gcal_event_id: gcalId || null, cf_email: user?.email || "anonymous_admin", status,
          is_potluck: isPotluck ? 1 : 0, is_volunteer: isVolunteer ? 1 : 0,
          published_at: publishedAt || null, season_id: seasonId || null
        })
        .execute();

      c.executionCtx.waitUntil(logAuditAction(c, "CREATE_EVENT", "events", genId, `Created event: ${title} (${status})`));

      if (status === "published") {
        const baseUrl = new URL(c.req.url).origin;
        if (socials) {
          c.executionCtx.waitUntil(dispatchSocials(c.env.DB, { title, url: `${baseUrl}/events`, snippet: "New event scheduled!", coverImageUrl: coverImage || "/gallery_1.png", baseUrl }, socialConfig as unknown as SocialConfig, socials));
        }
        c.executionCtx.waitUntil(sendZulipMessage(c.env, "announcements", "Calendar", `📅 **New Event:** ${title}\n📍 ${location || "TBD"}\n[View](${baseUrl}/events)`));
      }

      return { status: 200, body: { success: true, id: genId } };
    } catch {
      return { status: 200, body: { success: false, error: "Write failed" } };
    }
  },
  updateEvent: async ({ params, body }, c: Context<AppEnv>) => {
    const { id } = params;
    try {
      const db = c.get("db");
      const { title, category, dateStart, dateEnd, location, description, coverImage, tbaEventKey, isPotluck, isVolunteer, isDraft, publishedAt, seasonId } = body;
      const cat = category || 'internal';
      
      const user = await getSessionUser(c);
      const status = isDraft ? "pending" : (user?.role === "admin" ? "published" : "pending");

      if (user?.role !== "admin") {
        // Revision logic
        const revId = `${id}-rev-${Math.random().toString(36).substring(2, 6)}`;
        await db.insertInto("events")
          .values({
            id: revId, title, category: cat, date_start: dateStart, date_end: dateEnd || null,
            location: location || "", description: description || "", cover_image: coverImage || "",
            tba_event_key: tbaEventKey || null, status: 'pending',
            is_potluck: isPotluck ? 1 : 0, is_volunteer: isVolunteer ? 1 : 0,
            revision_of: id, published_at: publishedAt || null, season_id: seasonId || null
          })
          .execute();
        return { status: 200, body: { success: true, id: revId } };
      }

      await db.updateTable("events")
        .set({
          title, category: cat, date_start: dateStart, date_end: dateEnd || null,
          location: location || "", description: description || "", cover_image: coverImage || "",
          tba_event_key: tbaEventKey || null, status,
          is_potluck: isPotluck ? 1 : 0, is_volunteer: isVolunteer ? 1 : 0,
          published_at: publishedAt || null, season_id: seasonId || null
        })
        .where("id", "=", id)
        .execute();

      return { status: 200, body: { success: true, id } };
    } catch {
      return { status: 200, body: { success: false, error: "Update failed" } };
    }
  },
  deleteEvent: async ({ params }, c: Context<AppEnv>) => {
    const { id } = params;
    try {
      const db = c.get("db");
      await db.updateTable("events").set({ is_deleted: 1 }).where("id", "=", id).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  approveEvent: async ({ params }, c: Context<AppEnv>) => {
    const { id } = params;
    try {
      const db = c.get("db");
      const row = await db.selectFrom("events").selectAll().where("id", "=", id).executeTakeFirst();
      if (row && row.revision_of) {
        await db.updateTable("events")
          .set({ title: row.title, date_start: row.date_start, date_end: row.date_end, location: row.location, description: row.description, cover_image: row.cover_image, tba_event_key: row.tba_event_key, status: 'published', is_potluck: row.is_potluck, is_volunteer: row.is_volunteer, season_id: row.season_id })
          .where("id", "=", row.revision_of)
          .execute();
        await db.deleteFrom("events").where("id", "=", id).execute();
      } else {
        await db.updateTable("events").set({ status: 'published' }).where("id", "=", id).execute();
      }
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  rejectEvent: async ({ params }, c: Context<AppEnv>) => {
    const { id } = params;
    try {
      const db = c.get("db");
      await db.updateTable("events").set({ status: 'rejected' }).where("id", "=", id).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  undeleteEvent: async ({ params }, c: Context<AppEnv>) => {
    const { id } = params;
    try {
      const db = c.get("db");
      await db.updateTable("events").set({ is_deleted: 0 }).where("id", "=", id).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  purgeEvent: async ({ params }, c: Context<AppEnv>) => {
    const { id } = params;
    try {
      const db = c.get("db");
      await db.deleteFrom("events").where("id", "=", id).execute();
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  syncEvents: async (_, c: Context<AppEnv>) => {
    try {
      const db = c.get("db");
      const dbSettings = await getDbSettings(c);
      const gcalEmail = dbSettings["GCAL_SERVICE_ACCOUNT_EMAIL"];
      const gcalKey = dbSettings["GCAL_PRIVATE_KEY"];
      const user = await getSessionUser(c);

      const calendars = [
        { id: dbSettings["CALENDAR_ID_INTERNAL"] || dbSettings["CALENDAR_ID"], category: "internal" },
        { id: dbSettings["CALENDAR_ID_OUTREACH"], category: "outreach" },
        { id: dbSettings["CALENDAR_ID_EXTERNAL"], category: "external" }
      ].filter(cal => !!cal.id);

      if (!gcalEmail || !gcalKey || calendars.length === 0) throw new Error("Config missing");

      let total = 0;
      for (const cal of calendars) {
        const events = await pullEventsFromGcal({ email: gcalEmail as string, privateKey: gcalKey as string, calendarId: cal.id as string });
        for (const ev of events) {
          await db.insertInto("events")
            .values({ id: crypto.randomUUID(), title: ev.title, date_start: ev.date_start, date_end: ev.date_end || null, location: ev.location, description: ev.description, gcal_event_id: ev.gcal_event_id, cf_email: user?.email || "sync", status: 'published', category: cal.category })
            .onConflict(oc => oc.column("gcal_event_id").doUpdateSet({ title: ev.title, date_start: ev.date_start, date_end: ev.date_end || null, location: ev.location, description: ev.description, category: cal.category }))
            .execute();
          total++;
        }
      }
      return { status: 200, body: { success: true, count: total } };
    } catch {
      return { status: 200, body: { success: false } };
    }
  },
  getSignups: async ({ params }, c: Context<AppEnv>) => {
    const eventId = params.id;
    const user = await getSessionUser(c);
    const db = c.get("db");
    const isVerified = user && user.role !== "unverified";
    const isManagement = user && (user.role === "admin" || ["coach", "mentor"].includes(user.member_type || ""));

    const results = await db.selectFrom("event_signups as s")
      .join("user_profiles as p", "s.user_id", "p.user_id")
      .join("user as u", "s.user_id", "u.id")
      .selectAll("s")
      .select(["p.nickname", "u.image as avatar", "p.dietary_restrictions"])
      .where("s.event_id", "=", eventId)
      .where("u.role", "!=", "unverified")
      .orderBy("s.created_at", "asc")
      .execute();

    const signups = isVerified ? results.map((rec) => ({
      ...rec,
      is_own: user ? rec.user_id === user.id : false,
      attended: !!rec.attended,
      notes: (isManagement || (user && rec.user_id === user.id)) ? rec.notes : undefined
    })) : [];

    return { status: 200, body: { 
      signups, 
      dietary_summary: {}, 
      team_dietary_summary: {}, 
      authenticated: !!user, 
      role: user?.role || null, 
      member_type: user?.member_type || null, 
      can_manage: !!isManagement 
    }};
  },
  submitSignup: async ({ params, body }, c: Context<AppEnv>) => {
    const user = await getSessionUser(c);
    if (!user || user.role === "unverified") return { status: 403, body: { error: "Forbidden" } };
    const db = c.get("db");
    await db.insertInto("event_signups")
      .values({ event_id: params.id, user_id: user.id, bringing: body.bringing || "", notes: body.notes || "", prep_hours: body.prep_hours || 0 })
      .onConflict(oc => oc.columns(["event_id", "user_id"]).doUpdateSet({ bringing: body.bringing || "", notes: body.notes || "", prep_hours: body.prep_hours || 0 }))
      .execute();
    return { status: 200, body: { success: true } };
  },
  deleteMySignup: async ({ params }, c: Context<AppEnv>) => {
    const user = await getSessionUser(c);
    if (!user) return { status: 401, body: { error: "Unauthorized" } };
    const db = c.get("db");
    await db.deleteFrom("event_signups").where("event_id", "=", params.id).where("user_id", "=", user.id).execute();
    return { status: 200, body: { success: true } };
  },
  updateMyAttendance: async ({ params, body }, c: Context<AppEnv>) => {
    const user = await getSessionUser(c);
    if (!user) return { status: 401, body: { error: "Unauthorized" } };
    const db = c.get("db");
    await db.insertInto("event_signups")
      .values({ event_id: params.id, user_id: user.id, attended: body.attended ? 1 : 0 })
      .onConflict(oc => oc.columns(["event_id", "user_id"]).doUpdateSet({ attended: body.attended ? 1 : 0 }))
      .execute();
    return { status: 200, body: { success: true } };
  },
  updateUserAttendance: async ({ params, body }, c: Context<AppEnv>) => {
    const user = await getSessionUser(c);
    if (user?.role !== "admin" && !["coach", "mentor"].includes(user?.member_type || "")) return { status: 401, body: { error: "Unauthorized" } };
    const db = c.get("db");
    await db.insertInto("event_signups")
      .values({ event_id: params.id, user_id: params.userId, attended: body.attended ? 1 : 0 })
      .onConflict(oc => oc.columns(["event_id", "user_id"]).doUpdateSet({ attended: body.attended ? 1 : 0 }))
      .execute();
    return { status: 200, body: { success: true } };
  },
};
