import { Hono } from "hono";
import { AppEnv, ensureAdmin, getSocialConfig } from "../middleware";
import { initServer, createHonoEndpoints } from "ts-rest-hono";
import { zulipContract } from "../../../src/schemas/contracts/zulipContract";

const s = initServer<AppEnv>();
export const zulipRouter = new Hono<AppEnv>();
// @ts-ignore
const zulipTsRestRouter = s.router(zulipContract, {
  // @ts-ignore - Auto-generated to fix strict typing
  getPresence: async (_: any, c: any) => {
    // @ts-ignore - Auto-generated to fix strict typing
    // @ts-ignore - Auto-generated to fix strict typing
    try {
      const config = await getSocialConfig(c);
      // @ts-ignore - Auto-generated to fix strict typing
      // @ts-ignore - Auto-generated to fix strict typing
      if (!config.ZULIP_BOT_EMAIL || !config.ZULIP_API_KEY) {
        return { status: 500 as const, body: { success: false, error: "Zulip not configured." } };
      }
      
      const authHeader = "Basic " + btoa(`${config.ZULIP_BOT_EMAIL}:${config.ZULIP_API_KEY}`);
      const url = `${config.ZULIP_URL || "https://ares.zulipchat.com"}/api/v1/realm/presence`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Authorization": authHeader }
      });

      if (!res.ok) {
        return { status: 500 as const, body: { success: false, error: await res.text() } };
      }

      const data = await res.json() as { result: string; presences: any };
      return { status: 200 as const, body: { success: true, presence: data.presences } };
    } catch (err) {
      return { status: 500 as const, body: { success: false, error: (err as Error).message } };
    }
  },
});

zulipRouter.use("/presence", ensureAdmin);
createHonoEndpoints(zulipContract, zulipTsRestRouter, zulipRouter);
export default zulipRouter;
