import { Hono, Context } from "hono";
import { Bindings } from "./_shared";

const tbaRouter = new Hono<{ Bindings: Bindings }>();

async function getTBA(path: string, c: Context<{ Bindings: Bindings }>) {
  const { results: settingsRows } = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'TBA_API_KEY'").all();
  const apiKey = (settingsRows[0] as { value: string })?.value;
  if (!apiKey) throw new Error("TBA_API_KEY not configured");

  const r = await fetch(`https://www.thebluealliance.com/api/v3${path}`, {
    headers: { "X-TBA-Auth-Key": apiKey }
  });
  if (!r.ok) throw new Error(`TBA API error: ${r.status}`);
  return r.json();
}

// ── GET /tba/rankings/:eventKey ───────────────────────────────────────
tbaRouter.get("/rankings/:eventKey", async (c) => {
  try {
    const eventKey = c.req.param("eventKey");
    const data = await getTBA(`/event/${eventKey}/rankings`, c);
    return c.json(data);
  } catch (err) {
    console.error("TBA rankings error:", err);
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── GET /tba/matches/:eventKey ────────────────────────────────────────
tbaRouter.get("/matches/:eventKey", async (c) => {
  try {
    const eventKey = c.req.param("eventKey");
    const data = (await getTBA(`/event/${eventKey}/matches/simple`, c)) as Array<{ time?: number; [key: string]: unknown }>;
    const sorted = (data || []).sort((a: { time?: number }, b: { time?: number }) => (a.time || 0) - (b.time || 0));
    return c.json({ matches: sorted });
  } catch (err) {
    console.error("TBA matches error:", err);
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── GET /tba/team/:teamKey/events/:year ───────────────────────────────
tbaRouter.get("/team/:teamKey/events/:year", async (c) => {
  try {
    const { teamKey, year } = c.req.param();
    const data = await getTBA(`/team/${teamKey}/events/${year}/simple`, c);
    return c.json({ events: data });
  } catch (err) {
    console.error("TBA team events error:", err);
    return c.json({ error: (err as Error).message }, 500);
  }
});

export default tbaRouter;
