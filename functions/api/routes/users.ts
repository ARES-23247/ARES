/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hono } from "hono";
import { Kysely } from "kysely";
import { DB } from "../../../src/schemas/database";
import { createHonoEndpoints, initServer } from "ts-rest-hono";
import { userContract } from "../../../src/schemas/contracts/userContract";
import { AppEnv, ensureAdmin, logAuditAction } from "../middleware";
import { decrypt } from "../../utils/crypto";
import { upsertProfile } from "./_profileUtils";

const s = initServer<AppEnv>();
const usersRouter = new Hono<AppEnv>();

const userHandlers: any = {
  getUsers: async ({ query: _ }: any, c: any) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const results = await db.selectFrom("user as u")
        .leftJoin("user_profiles as p", "u.id", "p.user_id")
        .select([
          "u.id", "u.name", "u.email", "u.emailVerified", "u.image", "u.role", "u.createdAt", "u.updatedAt",
          "p.nickname", "p.member_type"
        ])
        .orderBy("u.createdAt", "desc")
        .execute();

      const users = results.map(u => ({
        ...u,
        emailVerified: !!u.emailVerified,
        createdAt: Number(u.createdAt),
        updatedAt: Number(u.updatedAt)
      }));

      return { status: 200, body: { users } };
    } catch {
      return { status: 500, body: { error: "Database error" } };
    }
  },
  adminDetail: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const secret = c.env.ENCRYPTION_SECRET;
      const row = await db.selectFrom("user as u")
        .leftJoin("user_profiles as p", "u.id", "p.user_id")
        .select([
          "u.id", "u.name", "u.email", "u.emailVerified", "u.image", "u.role", "u.createdAt", "u.updatedAt",
          "p.first_name", "p.last_name", "p.nickname", "p.phone", "p.contact_email",
          "p.show_email", "p.show_phone", "p.pronouns", "p.grade_year", "p.subteams",
          "p.member_type", "p.bio", "p.favorite_food", "p.dietary_restrictions",
          "p.favorite_first_thing", "p.fun_fact", "p.colleges", "p.employers",
          "p.show_on_about", "p.favorite_robot_mechanism", "p.pre_match_superstition",
          "p.leadership_role", "p.rookie_year", "p.tshirt_size",
          "p.emergency_contact_name", "p.emergency_contact_phone",
          "p.parents_name", "p.parents_email", "p.students_name", "p.students_email",
          "p.updated_at"
        ])
        .where("u.id", "=", params.id)
        .executeTakeFirst();

      if (!row) return { status: 404, body: { error: "User not found" } };

      const p = { ...row } as Record<string, unknown>;
      p.emergency_contact_name = await decrypt(p.emergency_contact_name as string, secret);
      p.emergency_contact_phone = await decrypt(p.emergency_contact_phone as string, secret);
      p.phone = await decrypt(p.phone as string, secret);
      p.contact_email = await decrypt(p.contact_email as string, secret);
      p.parents_name = await decrypt(p.parents_name as string, secret);
      p.parents_email = await decrypt(p.parents_email as string, secret);
      p.students_name = await decrypt(p.students_name as string, secret);
      p.students_email = await decrypt(p.students_email as string, secret);

      const user = {
        ...p,
        emailVerified: !!p.emailVerified,
        createdAt: Number(p.createdAt),
        updatedAt: Number(p.updatedAt),
        image: p.image || p.avatar || null
      };

      return { status: 200, body: { user: user as never } };
    } catch {
      return { status: 500, body: { error: "Database error" } };
    }
  },
  patchUser: async ({ params, body }: any, c: any) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const { role, member_type } = body;

      if (role) {
        await db.updateTable("user").set({ role }).where("id", "=", params.id).execute();
        await db.deleteFrom("session").where("userId", "=", params.id).execute();
      }
      if (member_type) {
        await db.insertInto("user_profiles")
          .values({ user_id: params.id, member_type })
          .onConflict((oc: any) => oc.column("user_id").doUpdateSet({ member_type }))
          .execute();
      }

      c.executionCtx.waitUntil(logAuditAction(c, "PATCH_USER", "user", params.id, `Updated user ${params.id}: role=${role}, type=${member_type}`));

      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Update failed" } };
    }
  },
  updateUserProfile: async ({ params, body }: any, c: any) => {
    try {
      await upsertProfile(c as never, params.id, body);
      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Profile update failed" } };
    }
  },
  deleteUser: async ({ params }: any, c: any) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const id = params.id;
      
      await db.deleteFrom("comments").where("user_id", "=", id).execute();
      await db.deleteFrom("event_signups").where("user_id", "=", id).execute();
      await db.deleteFrom("user_badges").where("user_id", "=", id).execute();
      await db.deleteFrom("user_profiles").where("user_id", "=", id).execute();
      await db.deleteFrom("session").where("userId", "=", id).execute();
      await db.deleteFrom("account").where("userId", "=", id).execute();
      await db.deleteFrom("user").where("id", "=", id).execute();

      c.executionCtx.waitUntil(logAuditAction(c, "DELETE_USER", "user", id, `Deleted user ${id}`));

      return { status: 200, body: { success: true } };
    } catch {
      return { status: 500, body: { error: "Delete failed" } };
    }
  },
};

const userTsRestRouter = s.router(userContract, userHandlers);
createHonoEndpoints(userContract, userTsRestRouter, usersRouter);

// Enforce admin globally
usersRouter.use("/*", ensureAdmin);

export default usersRouter;
