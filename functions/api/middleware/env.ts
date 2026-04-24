import { Context, Next } from "hono";
import { AppEnv } from "./utils";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function getValidatedEnv(runtimeEnv: Record<string, unknown>) {
  return createEnv({
    server: {
      ENVIRONMENT: z.enum(["development", "production", "test"]).default("development").optional(),
      BETTER_AUTH_SECRET: z.string().min(1, "Better Auth Secret is required"),
      BETTER_AUTH_URL: z.string().url("Valid Better Auth URL is required"),
      GOOGLE_CLIENT_ID: z.string().min(1),
      GOOGLE_CLIENT_SECRET: z.string().min(1),
      GITHUB_CLIENT_ID: z.string().min(1),
      GITHUB_CLIENT_SECRET: z.string().min(1),
      ENCRYPTION_SECRET: z.string().min(1),
      ZULIP_CLIENT_ID: z.string().min(1),
      ZULIP_CLIENT_SECRET: z.string().min(1),
      DEV_BYPASS: z.string().optional(),
    },
    clientPrefix: "PUBLIC_",
    client: {},
    runtimeEnv: runtimeEnv as Record<string, string | number | boolean | undefined>,
    skipValidation: !!runtimeEnv.SKIP_ENV_VALIDATION || ((globalThis as any).process?.env?.NODE_ENV === "test"),
    emptyStringAsUndefined: true,
  });
}

export const envMiddleware = async (c: Context<AppEnv>, next: Next) => {
  try {
    getValidatedEnv(c.env as unknown as Record<string, unknown>);
  } catch (err) {
    console.error("Environment Validation Error:", err);
    // In strict environments, we might want to return a 500 here, 
    // but we'll log it instead so we don't accidentally bring down the site.
  }
  await next();
};
