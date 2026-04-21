import { Hono } from "hono";
import { Bindings, getSocialConfig } from "./_shared";
import { buildGitHubConfig, fetchProjectBoard, createProjectItem, fetchProjectFields, updateProjectItemStatus } from "../../utils/githubProjects";

const zulipWebhookRouter = new Hono<{ Bindings: Bindings }>();

interface ZulipOutgoingPayload {
  token: string;
  message: {
    sender_email: string;
    sender_full_name: string;
    content: string;
    display_recipient: string;
    subject: string;
    type: string;
  };
  trigger: string;
}

// ── POST /webhooks/zulip — Handle outgoing webhook from Zulip ────────
zulipWebhookRouter.post("/", async (c) => {
  let body: ZulipOutgoingPayload;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ content: "❌ Invalid request payload." });
  }

  // Validate webhook token
  const expectedToken = c.env.ZULIP_WEBHOOK_TOKEN;
  if (expectedToken && body.token !== expectedToken) {
    console.warn("[ZulipWebhook] Invalid token");
    return c.json({ content: "❌ Unauthorized: Invalid webhook token." });
  }

  const rawContent = body.message?.content || "";
  // Strip the bot mention prefix (e.g., "@**ARES Bot**")
  const cleaned = rawContent.replace(/@\*\*[^*]+\*\*/g, "").trim();
  const parts = cleaned.split(/\s+/);
  const command = parts[0]?.toLowerCase();

  try {
    switch (command) {
      case "!help":
        return c.json({
          content: [
            "🤖 **ARES Bot Commands**",
            "",
            "| Command | Description |",
            "|---|---|",
            "| `!tasks` | List open GitHub Project items |",
            "| `!task <title>` | Create a new draft task |",
            "| `!task <index> done` | Mark a task as Done |",
            "| `!stats` | ARESWEB quick stats |",
            "| `!inquiries` | Pending inquiry count |",
            "| `!events` | Upcoming events |",
            "| `!help` | Show this help |",
          ].join("\n"),
        });

      case "!tasks": {
        const config = await getSocialConfig(c);
        const ghConfig = buildGitHubConfig(config);
        if (!ghConfig) {
          return c.json({ content: "⚠️ GitHub Projects not configured. Add `GITHUB_PAT` and `GITHUB_PROJECT_ID` in ARESWEB Integrations." });
        }
        const board = await fetchProjectBoard(ghConfig);
        if (board.items.length === 0) {
          return c.json({ content: `📋 **${board.title}** — No items found.` });
        }
        const lines = board.items.slice(0, 15).map((item, i) => {
          const status = item.status ? `\`${item.status}\`` : "—";
          const assignee = item.assignees.length > 0 ? `@${item.assignees[0]}` : "";
          return `${i + 1}. **${item.title}** ${status} ${assignee}`;
        });
        return c.json({
          content: `📋 **${board.title}** (${board.totalCount} total)\n\n${lines.join("\n")}`,
        });
      }

      case "!task": {
        const args = parts.slice(1);
        if (args.length === 0) {
          return c.json({ content: "Usage: `!task <title>` to create, or `!task <#> done` to complete." });
        }

        // Check if it's a completion command: "!task 3 done"
        const indexArg = parseInt(args[0]);
        if (!isNaN(indexArg) && args[1]?.toLowerCase() === "done") {
          const config = await getSocialConfig(c);
          const ghConfig = buildGitHubConfig(config);
          if (!ghConfig) return c.json({ content: "⚠️ GitHub Projects not configured." });

          const board = await fetchProjectBoard(ghConfig);
          const target = board.items[indexArg - 1];
          if (!target) return c.json({ content: `❌ No task at index ${indexArg}.` });

          // Find the "Status" field and "Done" option
          const fields = await fetchProjectFields(ghConfig);
          const statusField = fields.find(f => f.name === "Status" && f.options);
          const doneOption = statusField?.options?.find(o => o.name.toLowerCase().includes("done"));

          if (!statusField || !doneOption) {
            return c.json({ content: "⚠️ Could not find 'Status' field or 'Done' option on the project board." });
          }

          await updateProjectItemStatus(ghConfig, target.id, statusField.id, doneOption.id);
          return c.json({ content: `✅ **${target.title}** marked as Done!` });
        }

        // Otherwise, create a new task
        const title = args.join(" ");
        const config = await getSocialConfig(c);
        const ghConfig = buildGitHubConfig(config);
        if (!ghConfig) return c.json({ content: "⚠️ GitHub Projects not configured." });

        const itemId = await createProjectItem(ghConfig, title, `Created via Zulip by ${body.message.sender_full_name}`);
        return c.json({ content: `✅ Created task: **${title}**\nItem ID: \`${itemId}\`` });
      }

      case "!stats": {
        const [postsRes, eventsRes, usersRes, inquiriesRes] = await Promise.all([
          c.env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE is_deleted = 0 AND status = 'published'").first<{ count: number }>(),
          c.env.DB.prepare("SELECT COUNT(*) as count FROM events WHERE is_deleted = 0 AND status = 'published'").first<{ count: number }>(),
          c.env.DB.prepare("SELECT COUNT(*) as count FROM user_profiles").first<{ count: number }>(),
          c.env.DB.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'").first<{ count: number }>(),
        ]);

        return c.json({
          content: [
            "📊 **ARESWEB Quick Stats**",
            "",
            `| Metric | Count |`,
            `|---|---|`,
            `| Published Posts | ${postsRes?.count || 0} |`,
            `| Active Events | ${eventsRes?.count || 0} |`,
            `| Team Members | ${usersRes?.count || 0} |`,
            `| Pending Inquiries | ${inquiriesRes?.count || 0} |`,
          ].join("\n"),
        });
      }

      case "!inquiries": {
        const result = await c.env.DB.prepare(
          "SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'"
        ).first<{ count: number }>();
        const count = result?.count || 0;
        return c.json({
          content: count > 0
            ? `🔔 **${count} pending inquir${count === 1 ? "y" : "ies"}** — [Review in Dashboard](https://aresfirst.org/dashboard?tab=inquiries)`
            : "✅ No pending inquiries! All caught up.",
        });
      }

      case "!events": {
        const { results } = await c.env.DB.prepare(
          "SELECT title, date_start, location FROM events WHERE is_deleted = 0 AND status = 'published' AND date_start >= date('now') ORDER BY date_start ASC LIMIT 10"
        ).all();

        if (!results || results.length === 0) {
          return c.json({ content: "📅 No upcoming events scheduled." });
        }

        const lines = results.map((e: Record<string, unknown>) => {
          const dt = new Date(String(e.date_start)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          return `• **${e.title}** — ${dt}${e.location ? ` @ ${e.location}` : ""}`;
        });

        return c.json({
          content: `📅 **Upcoming Events** (${results.length})\n\n${lines.join("\n")}`,
        });
      }

      default:
        return c.json({
          content: `❓ Unknown command: \`${command || "(empty)"}\`. Type \`!help\` for available commands.`,
        });
    }
  } catch (err) {
    console.error("[ZulipWebhook] Command error:", err);
    return c.json({
      content: `❌ Command failed: ${(err as Error)?.message || "Unknown error"}`,
    });
  }
});

export default zulipWebhookRouter;
