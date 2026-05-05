/**
 * ts-rest contract type utilities.
 * Provides foundation for contract-based API handlers (Phase 29).
 */

import type { AppRoute } from "@ts-rest/core";
import type { HonoContext } from "./api";
import type { AppRouteImplementation, AppRouteInput, ServerInferResponses, RecursiveRouterObj } from "ts-rest-hono";

/**
 * Input type inferred from a ts-rest contract definition.
 */
export type ContractInput<T extends AppRoute> = T extends {
  path: string;
  method: string;
  body: infer B;
  pathParams: infer P;
  query: infer Q;
}
  ? { body: B; params: P; query: Q }
  : never;

/**
 * Response type inferred from a ts-rest contract definition.
 */
export type ContractResponse<T extends AppRoute> = T extends {
  responses: infer R;
}
  ? R
  : never;

/**
 * Re-exports from ts-rest-hono for contract inference.
 * Use these types instead of custom HandlerInput for ts-rest handlers.
 */
export type { AppRouteImplementation, AppRouteInput, ServerInferResponses, RecursiveRouterObj };

/**
 * Legacy: Use AppRouteImplementation from ts-rest-hono instead. Contract handler function type for ts-rest integration (Phase 27 pattern, superseded in Phase 29).
 *
 * @example
 * const handler: ContractHandler<sponsorContract> = async (input, c) => {
 *   return { status: 200, body: { id: '123', name: 'Sponsor' } };
 * };
 */
export type ContractHandler<T extends AppRoute> = (
  input: ContractInput<T>,
  c: HonoContext,
) => Promise<ContractResponse<T>>;
