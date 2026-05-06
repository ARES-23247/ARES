import { Hono } from "hono";
import { AppEnv, ensureAdmin, ensureAuth, getSocialConfig, s } from "../middleware";
import { createHonoEndpoints } from "ts-rest-hono";
import { z } from "zod";
import { zulipContract } from "../../../shared/schemas/contracts/zulipContract";
import type { HonoContext } from "@shared/types/api";
export const zulipRouter = new Hono<AppEnv>();

import { zulipPresenceSchema } from "../../../shared/schemas/contracts/zulipContract";

// Normalize emails by removing dots for Google Workspace / Gmail domains
// Gmail ignores dots in the local part, so these are the same address
function normalizeEmail(email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const isGoogleBacked = cleanEmail.endsWith("@gmail.com") ||
                         cleanEmail.endsWith("@googlemail.com") ||
                         cleanEmail.endsWith("@aresfirst.org");

  if (!isGoogleBacked) {
    return cleanEmail;
  }
  const [local, domain] = cleanEmail.split("@");
  return `${local.replace(/\./g, "")}@${domain}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- ts-rest handler input validated by contract library */
const zulipHandlers: any = {
  getPresence: async (_input: any, c: HonoContext) => {
    try {
      const config = await getSocialConfig(c);
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } };
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
        return { status: 500 as const, body: { success: false, error: await res.text() } };
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
      return { status: 200 as const, body: { success: true, presence: data.presences, userNames } };
    } catch (err) {
      return { status: 500 as const, body: { success: false, error: (err as Error).message } };
    }
  },
  sendMessage: async (input: any, c: HonoContext) => {
    try {
      const { sendZulipMessage } = await import("../../utils/zulipSync");
      const config = await getSocialConfig(c);
      
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } };
      }

      // Attribute message to the logged-in ARES user instead of showing as "ARES Bot"
      const sessionUser = c.get("sessionUser") as { nickname?: string; name?: string; email?: string } | undefined;
      const senderName = sessionUser?.nickname || sessionUser?.name || "ARES Member";
      const attributedContent = `**${senderName}** (via ARES Web):\n\n${input.body.content}`;

      const res = await sendZulipMessage(
        { ZULIP_EMAIL: config.ZULIP_BOT_EMAIL, ZULIP_API_KEY: config.ZULIP_API_KEY, ZULIP_URL: config.ZULIP_URL },
        input.body.stream,
        input.body.topic,
        attributedContent,
        "stream"
      );

      if (!res) {
        return { status: 500 as const, body: { success: false, error: "Failed to send message" } };
      }

      return { status: 200 as const, body: { success: true } };
    } catch (err) {
      return { status: 500 as const, body: { success: false, error: (err as Error).message } };
    }
  },
  getTopicMessages: async (input: any, c: HonoContext) => {
    try {
      const config = await getSocialConfig(c);
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } };
      }

      const credentials = `${config.ZULIP_BOT_EMAIL}:${config.ZULIP_API_KEY}`;
      const authHeader = "Basic " + btoa(unescape(encodeURIComponent(credentials)));
      const url = new URL(`${config.ZULIP_URL || "https://aresfirst.zulipchat.com"}/api/v1/messages`);
      
      const narrow = [
        { operator: "stream", operand: input.query.stream },
        { operator: "topic", operand: input.query.topic }
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
          return { status: 403 as const, body: { success: false, error: "Zulip bot is not subscribed to this stream." } };
        }
        return { status: 500 as const, body: { success: false, error: await res.text() } };
      }

      const data = await res.json() as { result: string; messages: unknown[] };
      return { status: 200 as const, body: { success: true, messages: data.messages } };
    } catch (err) {
      return { status: 500 as const, body: { success: false, error: (err as Error).message } };
    }
  },
  auditMissingUsers: async (_input: any, c: HonoContext) => {
    try {
      const config = await getSocialConfig(c);
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured. Set ZULIP_BOT_EMAIL and ZULIP_API_KEY in settings." } };
      }

      const credentials = `${config.ZULIP_BOT_EMAIL}:${config.ZULIP_API_KEY}`;
      const authHeader = "Basic " + btoa(unescape(encodeURIComponent(credentials)));
      const baseUrl = config.ZULIP_URL || "https://aresfirst.zulipchat.com";

      console.log(`[Zulip:Audit] Fetching all users from ${baseUrl}`);

      // Fetch all users with pagination - Zulip API returns max 100 per page
      const zulipEmails = new Set<string>();
      let page = 1;
      const maxPages = 10; // Safety limit: up to 1000 users
      let hasMore = true;

      while (hasMore && page <= maxPages) {
        const url = new URL(`${baseUrl}/api/v1/users`);
        url.searchParams.append("client_gravatar", "false");
        url.searchParams.append("page", String(page));

        console.log(`[Zulip:Audit] Fetching page ${page}...`);

        const zulipRes = await fetch(url.toString(), {
          method: "GET",
          headers: { "Authorization": authHeader }
        });

        if (!zulipRes.ok) {
          const errText = await zulipRes.text().catch(() => "(no body)");
          console.error(`[Zulip:Audit] Failed to fetch users page ${page}: ${zulipRes.status} — ${errText}`);
          return { status: 500 as const, body: { success: false, error: `Zulip API returned ${zulipRes.status}: ${errText.slice(0, 200)}` } };
        }

        const zulipData = await zulipRes.json() as { members: Array<{ email: string; delivery_email?: string | null; is_bot?: boolean; is_active?: boolean }> };

        if (!zulipData.members || !Array.isArray(zulipData.members)) {
          console.error("[Zulip:Audit] No members array in response:", JSON.stringify(zulipData).slice(0, 500));
          return { status: 500 as const, body: { success: false, error: "Zulip returned invalid data — no members array" } };
        }

        // Add emails from this page
        const beforeSize = zulipEmails.size;
        for (const m of zulipData.members) {
          if (m.is_active !== false && !m.is_bot) {
            // With admin privileges, delivery_email should contain the real email address
            // delivery_email is the email Zulip actually uses for notifications
            // email may be the internal Zulip email for SSO users
            const email = normalizeEmail((m.delivery_email || m.email || ""));
            zulipEmails.add(email);
          }
        }
        console.log(`[Zulip:Audit] Page ${page}: added ${zulipEmails.size - beforeSize} emails (total: ${zulipEmails.size})`);

        // Check if there are more pages
        if (zulipData.members.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      }

      console.log(`[Zulip:Audit] Total: ${zulipEmails.size} active non-bot Zulip users`);

      const db = c.get("db") as import("kysely").Kysely<import("../../../shared/schemas/database").DB>;
      const aresUsers = await db.selectFrom("user").select("email").where("role", "!=", "unverified").execute();

      const missingEmails = aresUsers
        .map(u => u.email)
        .filter(email => {
          if (!email) return false;
          const normalized = normalizeEmail(email);
          return !zulipEmails.has(normalized);
        }) as string[];

      console.log(`[Zulip:Audit] ${aresUsers.length} ARES users, ${missingEmails.length} missing from Zulip`);

      // Debug: Include sample emails in response for troubleshooting
      const sampleZulip = Array.from(zulipEmails).slice(0, 10);
      const sampleMissing = missingEmails.slice(0, 10);

      return { status: 200 as const, body: {
        success: true,
        missingEmails,
        debug: {
          totalZulipUsers: zulipEmails.size,
          totalAresUsers: aresUsers.length,
          sampleZulipEmails: sampleZulip,
          sampleMissingEmails: sampleMissing
        }
      } as z.infer<typeof zulipContract.auditMissingUsers.responses[200]> };
    } catch (err) {
      console.error("[Zulip:Audit] Unexpected error:", err);
      return { status: 500 as const, body: { success: false, error: (err as Error).message } };
    }
  },
  inviteUsers: async (input: any, c: HonoContext) => {
    try {
      const config = await getSocialConfig(c);
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } };
      }

      const { emails } = (input as { body: { emails: string[] } }).body;
      if (!emails || emails.length === 0) {
        return { status: 200 as const, body: { success: true, invitedCount: 0 } };
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

      console.log(`[Zulip:Invite] Starting invite for ${emails.length} emails to ${baseUrl}`);

      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        const params = new URLSearchParams();
        params.append("invitee_emails", batch.join(","));
        params.append("stream_ids", JSON.stringify(streamIds));
        params.append("include_realm_default_subscriptions", "true");
        params.append("invite_as", "400"); // Member

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const inviteRes = await fetch(`${baseUrl}/api/v1/invites`, {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params,
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const resText = await inviteRes.text();

          console.log(`[Zulip:Invite] Batch ${i / BATCH_SIZE + 1} response: ${inviteRes.status}`);

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
          // Provide more helpful error message for common failures
          if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("network") || msg.includes("ENOTFOUND")) {
            allErrors.push(`Network error connecting to Zulip (${baseUrl}). Check URL, DNS, and firewall.`);
          } else if (msg.includes("aborted")) {
            allErrors.push(`Request timeout after 30 seconds. Zulip may be slow or unreachable.`);
          } else {
            allErrors.push(msg);
          }
        }
      }

      if (allErrors.length > 0 && totalInvited === 0) {
        return { status: 500 as const, body: { success: false, error: allErrors.join("; ") } };
      }

      return { status: 200 as const, body: { success: true, invitedCount: totalInvited } };
    } catch (err) {
      console.error("[Zulip:Invite] Unexpected error:", err);
      return { status: 500 as const, body: { success: false, error: (err as Error).message } };
    }
  }
};
const zulipTsRestRouter = s.router(zulipContract, zulipHandlers as any);
/* eslint-enable @typescript-eslint/no-explicit-any */

// CR-07 FIX: Apply authentication to all Zulip routes
// Admin-only routes override the base authentication
zulipRouter.use("*", ensureAuth);
zulipRouter.use("/presence", ensureAdmin);
zulipRouter.use("/invites/*", ensureAdmin);
createHonoEndpoints(
  zulipContract,
  zulipTsRestRouter,
  zulipRouter,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, _c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);
export default zulipRouter;
