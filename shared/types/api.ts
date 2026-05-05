/**
 * Hono API handler types and context utilities.
 * Provides type-safe context and handler input/output contracts.
 */

import type { Context } from "hono";
import type {
  Bindings,
  Variables,
  AppEnv as MiddlewareAppEnv,
} from "../../functions/api/middleware/utils";

/**
 * Branded Hono context type with ARES Bindings and Variables.
 * Re-exports AppEnv from middleware to avoid circular dependencies.
 */
export type { AppEnv as MiddlewareAppEnv } from "../../functions/api/middleware/utils";

export type AppEnv = MiddlewareAppEnv;

/**
 * Hono context with ARES-specific environment bindings.
 */
export type HonoContext = Context<AppEnv>;

/**
 * Standard handler input structure with typed body and params.
 *
 * @example
 * interface CreateSponsorInput extends HandlerInput<SponsorCreateBody, {}> {}
 */
export type HandlerInput<
  TBody = unknown,
  TParams extends Record<string, string> = Record<string, string>,
> = {
  body: TBody;
  query: Record<string, string>;
  params: TParams;
};

/**
 * Standard handler output structure with status and typed body.
 *
 * @example
 * interface SponsorListOutput extends HandlerOutput<Sponsor[]> {}
 */
export type HandlerOutput<TBody = unknown> = {
  status: number;
  body: TBody;
};
