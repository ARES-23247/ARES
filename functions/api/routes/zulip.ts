import { Hono } from "hono";
import { AppEnv, ensureAdmin, ensureAuth, getSocialConfig } from "../middleware";
import { initServer, createHonoEndpoints } from "ts-rest-hono";
import { zulipContract } from "../../../shared/schemas/contracts/zulipContract";

const s = initServer<AppEnv>();
export const zulipRouter = new Hono<AppEnv>();

import { Context } from "hono";

import { z } from "zod";
import { zulipPresenceSchema } from "../../../shared/schemas/contracts/zulipContract";

const zulipHandlers = {
  getPresence: async (_: any, c: Context<AppEnv>) => {
    try {
      const config = await getSocialConfig(c);
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } as any };
      }
      
      // Unicode-safe Base64 encoding to prevent "btoa() can only operate on characters in the Latin1 range" errors
      // if credentials contain hidden unicode characters or non-breaking spaces.
      const credentials = `${config.ZULIP_BOT_EMAIL}:${config.ZULIP_API_KEY}`;
      const authHeader = "Basic " + btoa(unescape(encodeURIComponent(credentials)));
      const url = `${config.ZULIP_URL || "https://aresfirst.zulipchat.com"}/api/v1/realm/presence`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Authorization": authHeader }
      });

      if (!res.ok) {
        return { status: 500 as const, body: { success: false, error: await res.text() } as any };
      }

      const usersRes = await fetch(`${config.ZULIP_URL || "https://aresfirst.zulipchat.com"}/api/v1/users`, {
        method: "GET",
        headers: { "Authorization": authHeader }
      });

      let userNames: Record<string, string> = {};
      if (usersRes.ok) {
        const usersData = await usersRes.json() as { members: Array<{ email: string; full_name: string }> };
        if (usersData.members) {
          userNames = usersData.members.reduce((acc, user) => {
            acc[user.email] = user.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const data = await res.json() as { result: string; presences: z.infer<typeof zulipPresenceSchema> };
      return { status: 200 as const, body: { success: true, presence: data.presences, userNames } as any };
    } catch (err) {
      return { status: 500 as const, body: { success: false, error: (err as Error).message } as any };
    }
  },
  sendMessage: async ({ body }: any, c: Context<AppEnv>) => {
    try {
      const { sendZulipMessage } = await import("../../utils/zulipSync");
      const config = await getSocialConfig(c);
      
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } as any };
      }

      // Attribute message to the logged-in ARES user instead of showing as "ARES Bot"
      const sessionUser = c.get("sessionUser") as { nickname?: string; name?: string; email?: string } | undefined;
      const senderName = sessionUser?.nickname || sessionUser?.name || "ARES Member";
      const attributedContent = `**${senderName}** (via ARES Web):\n\n${body.content}`;

      const res = await sendZulipMessage(
        { ZULIP_EMAIL: config.ZULIP_BOT_EMAIL, ZULIP_API_KEY: config.ZULIP_API_KEY, ZULIP_URL: config.ZULIP_URL },
        body.stream,
        body.topic,
        attributedContent,
        "stream"
      );

      if (!res) {
        return { status: 500 as const, body: { success: false, error: "Failed to send message" } as any };
      }

      return { status: 200 as const, body: { success: true } as any };
    } catch (err) {
      return { status: 500 as const, body: { success: false, error: (err as Error).message } as any };
    }
  },
  getTopicMessages: async ({ query }: any, c: Context<AppEnv>) => {
    try {
      const config = await getSocialConfig(c);
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } as any };
      }

      const credentials = `${config.ZULIP_BOT_EMAIL}:${config.ZULIP_API_KEY}`;
      const authHeader = "Basic " + btoa(unescape(encodeURIComponent(credentials)));
      const url = new URL(`${config.ZULIP_URL || "https://aresfirst.zulipchat.com"}/api/v1/messages`);
      
      const narrow = [
        { operator: "stream", operand: query.stream },
        { operator: "topic", operand: query.topic }
      ];

      url.searchParams.append("narrow", JSON.stringify(narrow));
      url.searchParams.append("anchor", "newest");
      url.searchParams.append("num_before", "100");
      url.searchParams.append("num_after", "0");

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { "Authorization": authHeader }
      });

      if (!res.ok) {
        if (res.status === 403) {
          return { status: 403 as const, body: { success: false, error: "Zulip bot is not subscribed to this stream." } as any };
        }
        return { status: 500 as const, body: { success: false, error: await res.text() } as any };
      }

      const data = await res.json() as { result: string; messages: any[] };
      return { status: 200 as const, body: { success: true, messages: data.messages } as any };
    } catch (err) {
      return { status: 500 as const, body: { success: false, error: (err as Error).message } as any };
    }
  },
  auditMissingUsers: async (_: any, c: Context<AppEnv>) => {
    try {
      const config = await getSocialConfig(c);
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured. Set ZULIP_BOT_EMAIL and ZULIP_API_KEY in settings." } as any };
      }

      const credentials = `${config.ZULIP_BOT_EMAIL}:${config.ZULIP_API_KEY}`;
      const authHeader = "Basic " + btoa(unescape(encodeURIComponent(credentials)));
      const baseUrl = config.ZULIP_URL || "https://aresfirst.zulipchat.com";
      const url = `${baseUrl}/api/v1/users?client_gravatar=false`;

      console.log(`[Zulip:Audit] Fetching users from ${baseUrl}`);

      const zulipRes = await fetch(url, {
        method: "GET",
        headers: { "Authorization": authHeader }
      });

      if (!zulipRes.ok) {
        const errText = await zulipRes.text().catch(() => "(no body)");
        console.error(`[Zulip:Audit] Failed to fetch users: ${zulipRes.status} — ${errText}`);
        return { status: 500 as const, body: { success: false, error: `Zulip API returned ${zulipRes.status}: ${errText.slice(0, 200)}` } as any };
      }

      const zulipData = await zulipRes.json() as { members: Array<{ email: string; delivery_email?: string | null; is_bot?: boolean; is_active?: boolean }> };
      
      if (!zulipData.members || !Array.isArray(zulipData.members)) {
        console.error("[Zulip:Audit] No members array in response:", JSON.stringify(zulipData).slice(0, 500));
        return { status: 500 as const, body: { success: false, error: "Zulip returned invalid data — no members array" } as any };
      }

      // Collect all known Zulip emails (delivery_email takes priority over email,
      // but may be null if the bot lacks admin privileges)
      const zulipEmails = new Set(
        zulipData.members
          .filter(m => m.is_active !== false && !m.is_bot)
          .map(m => (m.delivery_email || m.email).toLowerCase())
      );

      console.log(`[Zulip:Audit] Found ${zulipEmails.size} active non-bot Zulip users`);

      const db = c.get("db") as import("kysely").Kysely<import("../../../shared/schemas/database").DB>;
      const aresUsers = await db.selectFrom("user").select("email").where("role", "!=", "unverified").execute();
      
      const missingEmails = aresUsers
        .map(u => u.email)
        .filter(email => email && !zulipEmails.has(email.toLowerCase()));

      console.log(`[Zulip:Audit] ${aresUsers.length} ARES users, ${missingEmails.length} missing from Zulip`);

      return { status: 200 as const, body: { success: true, missingEmails } as any };
    } catch (err) {
      console.error("[Zulip:Audit] Unexpected error:", err);
      return { status: 500 as const, body: { success: false, error: (err as Error).message } as any };
    }
  },
  inviteUsers: async ({ body }: any, c: Context<AppEnv>) => {
    try {
      const config = await getSocialConfig(c);
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } as any };
      }

      const { emails } = body;
      if (!emails || emails.length === 0) {
        return { status: 200 as const, body: { success: true, invitedCount: 0 } as any };
      }

      const credentials = `${config.ZULIP_BOT_EMAIL}:${config.ZULIP_API_KEY}`;
      const authHeader = "Basic " + btoa(unescape(encodeURIComponent(credentials)));
      const baseUrl = config.ZULIP_URL || "https://aresfirst.zulipchat.com";

      // Fetch default streams to add the users to
      const streamsRes = await fetch(`${baseUrl}/api/v1/default_streams`, {
        method: "GET",
        headers: { "Authorization": authHeader }
      });

      let streamIds: number[] = [];
      if (streamsRes.ok) {
        const streamsData = await streamsRes.json() as { default_streams?: Array<{ stream_id: number }> };
        streamIds = (streamsData.default_streams || []).map(s => s.stream_id);
      }

      // Send invites in batches of 10 to avoid Zulip rate limits and partial failures
      const BATCH_SIZE = 10;
      let totalInvited = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        const params = new URLSearchParams();
        params.append("invitee_emails", batch.join(","));
        params.append("stream_ids", JSON.stringify(streamIds));
        params.append("include_realm_default_subscriptions", "true");
        params.append("invite_as", "400"); // Member

        try {
          const inviteRes = await fetch(`${baseUrl}/api/v1/invites`, {
            method: "POST",
            headers: { 
              "Authorization": authHeader,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
          });

          const resText = await inviteRes.text();
          
          if (inviteRes.ok) {
            totalInvited += batch.length;
          } else {
            console.error(`[Zulip:Invite] Batch ${i / BATCH_SIZE + 1} error (${inviteRes.status}):`, resText);
            
            try {
              const errJson = JSON.parse(resText);
              if (errJson.sent_invitations === true) {
                // Partial success — some users already had accounts
                totalInvited += batch.length;
              } else {
                allErrors.push(errJson.msg || resText.slice(0, 200));
              }
            } catch {
              allErrors.push(`HTTP ${inviteRes.status}: ${resText.slice(0, 200)}`);
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[Zulip:Invite] Batch ${i / BATCH_SIZE + 1} fetch error:`, msg);
          allErrors.push(msg);
        }
      }

      if (allErrors.length > 0 && totalInvited === 0) {
        return { status: 500 as const, body: { success: false, error: allErrors.join("; ") } as any };
      }

      return { status: 200 as const, body: { success: true, invitedCount: totalInvited } as any };
    } catch (err) {
      console.error("[Zulip:Invite] Unexpected error:", err);
      return { status: 500 as const, body: { success: false, error: (err as Error).message } as any };
    }
  },
};

const zulipTsRestRouter = s.router(zulipContract, zulipHandlers as any);

zulipRouter.use("/presence", ensureAdmin);
zulipRouter.use("/invites/*", ensureAdmin);
zulipRouter.use("/message", ensureAuth);
createHonoEndpoints(zulipContract, zulipTsRestRouter, zulipRouter);
export default zulipRouter;
