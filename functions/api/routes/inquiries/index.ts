/* eslint-disable @typescript-eslint/no-explicit-any -- ts-rest handler input validated by contract library */
import { Hono } from "hono";
import { createHonoEndpoints } from "ts-rest-hono";
import { inquiryContract } from "../../../../shared/schemas/contracts/inquiryContract";
import { AppEnv, ensureAdmin, turnstileMiddleware, persistentRateLimitMiddleware, s } from "../../middleware";
import { inquiryHandlers } from "./handlers";
import type { HonoContext } from "@shared/types/api";

const inquiriesRouter = new Hono<AppEnv>();

const inquiriesTsRestRouter = s.router(inquiryContract, inquiryHandlers as any);

// Apply protections
inquiriesRouter.use("/admin", ensureAdmin);
inquiriesRouter.use("/admin/*", ensureAdmin);

// Rate limiting for public submissions
inquiriesRouter.post("/", persistentRateLimitMiddleware(5, 300));

// Turnstile for public submissions
inquiriesRouter.use("/", async (c, next) => {
  if (c.req.method === "POST" && !c.req.path.includes("/admin")) {
    return turnstileMiddleware()(c, next);
  }
  return next();
});

createHonoEndpoints(
  inquiryContract,
  inquiriesTsRestRouter,
  inquiriesRouter,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, _c: HonoContext) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);

export default inquiriesRouter;
export { purgeOldInquiries } from "./handlers";

