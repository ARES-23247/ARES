// ── Scouting Routes Index ────────────────────────────────────────────
// Aggregates all scouting sub-routes (TOA proxy, FTC Events proxy,
// AI analysis) under a single router for mounting in the main API.

import { Hono } from "hono";
import { AppEnv, ensureAuth } from "../../middleware";
import toaProxy from "./toa-proxy";
import ftcEventsProxy from "./ftcevents-proxy";
import analyzeRouter from "./analyze";

const scoutingRouter = new Hono<AppEnv>();

// All scouting routes require authentication to protect API keys and AI costs
scoutingRouter.use("/*", ensureAuth);

// Sub-route mounting
scoutingRouter.route("/toa", toaProxy);
scoutingRouter.route("/ftcevents", ftcEventsProxy);
scoutingRouter.route("/analyze", analyzeRouter);

export default scoutingRouter;
