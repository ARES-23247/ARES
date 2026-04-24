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

const userTsRestRouter = s.router(userContract, {
  getUsers: async ({ query: _ }, c) => {
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

      const users = results.map(u => {
        // SEC-YPP: Mask student emails in bulk lists to prevent accidental exposure
        // We only show the full email for verified authors/admins to reduce PII surface
        const isStudent = u.member_type === "student" || u.role === "user";
        const maskedEmail = isStudent 
          ? u.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => `${a}${"*".repeat(b.length)}`)
          : u.email;

        return {
          id: u.id,
          name: u.name || null,
          email: maskedEmail,
          emailVerified: !!u.emailVerified,
          image: u.image || null,
          role: u.role || "user",
          createdAt: Number(u.createdAt),
          updatedAt: Number(u.updatedAt),
          nickname: u.nickname || null,
          member_type: u.member_type || null
        };
      });

      return { status: 200, body: { users } };
    } catch (err) {
      console.error("[Users] getUsers failed:", err);
      return { status: 500, body: { error: "Database error" } };
    }
  },
  adminDetail: async ({ params }, c) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const secret = c.env.ENCRYPTION_SECRET;
      const row = await db.selectFrom("user as u")
        .leftJoin("user_profiles as p", "u.id", "p.user_id")
        .select([
          "u.id", "u.name", "u.email", "u.emailVerified", "u.image", "u.role", "u.createdAt", "u.updatedAt",
          "p.nickname", "p.member_type"
        ])
        .where("u.id", "=", params.id)
        .executeTakeFirst();

      if (!row) return { status: 404, body: { error: "User not found" } };

      return { 
        status: 200, 
        body: { 
          user: {
            id: row.id,
            name: row.name || null,
            email: row.email,
            emailVerified: !!row.emailVerified,
            image: row.image || null,
            role: row.role || "user",
            createdAt: Number(row.createdAt),
            updatedAt: Number(row.updatedAt),
            nickname: row.nickname || null,
            member_type: row.member_type || null
          }
        } 
      };
    } catch (err) {
      console.error("[Users] adminDetail failed:", err);
      return { status: 500, body: { error: "Database error" } };
    }
  },
  patchUser: async ({ params, body }, c) => {
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
          .onConflict(oc => oc.column("user_id").doUpdateSet({ member_type }))
          .execute();
      }

      c.executionCtx.waitUntil(logAuditAction(c, "PATCH_USER", "user", params.id, `Updated user ${params.id}: role=${role}, type=${member_type}`));

      return { status: 200, body: { success: true } };
    } catch (err) {
      console.error("[Users] patchUser failed:", err);
      return { status: 500, body: { error: "Update failed" } };
    }
  },
  updateUserProfile: async ({ params, body }, c) => {
    try {
      await upsertProfile(c as never, params.id, body);
      return { status: 200, body: { success: true } };
    } catch (err) {
      console.error("[Users] updateUserProfile failed:", err);
      return { status: 500, body: { error: "Profile update failed" } };
    }
  },
  deleteUser: async ({ params }, c) => {
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
    } catch (err) {
      console.error("[Users] deleteUser failed:", err);
      return { status: 500, body: { error: "Delete failed" } };
    }
  },
});

createHonoEndpoints(userContract, userTsRestRouter, usersRouter);

// Enforce admin globally
usersRouter.use("/*", ensureAdmin);

export default usersRouter;

const userTsRestRouter = s.router(userContract, userHandlers);
createHonoEndpoints(userContract, userTsRestRouter, usersRouter);

// Enforce admin globally
usersRouter.use("/*", ensureAdmin);

export default usersRouter;
