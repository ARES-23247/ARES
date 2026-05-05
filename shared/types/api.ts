/**
 * Hono API handler types and context utilities.
 * Provides type-safe context and handler input/output contracts.
 */

import type { Context } from "hono";
import type {
  AppEnv as MiddlewareAppEnv,
} from "../../functions/api/middleware/utils";

// Import types from @ts-rest/core
import type { AppRoute, ServerInferRequest } from "@ts-rest/core";

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
 * Type for ts-rest handler input parameters.
 * Extracts params, body, query, and headers from a route contract.
 *
 * This is a simplified version of the internal ts-rest-hono AppRouteInput type.
 * We use ServerInferRequest from @ts-rest/core which provides params, body, query, and headers.
 * The full ts-rest-hono AppRouteInput also includes `req: Request`, but that's not needed
 * for most handlers.
 *
 * @example
 * import type { AppRouteInput } from "@shared/types/api";
 * import { myContract } from "../contracts/myContract";
 *
 * const handler = async (input: AppRouteInput<typeof myContract.myRoute>, c: HonoContext) => {
 *   const { id } = input.params; // typed from contract
 *   const { name } = input.body; // typed from contract
 *   // ...
 * };
 */
export type AppRouteInput<T extends AppRoute> = ServerInferRequest<T>;

/**
 * Standard handler input structure with typed body and params.
 *
 * @deprecated Use AppRouteInput from ts-rest-hono for ts-rest handlers.
 * This type is still useful for non-ts-rest Hono middleware.
 * @see Migration guide in Phase 29 summary.
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
