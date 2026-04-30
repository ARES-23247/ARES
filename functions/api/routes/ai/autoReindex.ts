import { indexSiteContent } from "./indexer";
import { Kysely } from "kysely";
import { DB } from "../../../../shared/schemas/database";

/**
 * Trigger an incremental re-index in the background after a content mutation.
 * Uses waitUntil so it doesn't block the response.
 *
 * This is the safe alternative to catch-all middleware — called explicitly
 * from individual route handlers, same pattern as audit logging.
 *
 * Cost: ~50 neurons per call (incremental, only changed docs).
 */
export function triggerBackgroundReindex(
  executionCtx: ExecutionContext,
  db: Kysely<DB>,
  ai: Ai | undefined,
  vectorize: VectorizeIndex | undefined,
  kv?: KVNamespace
): void {
  if (!ai || !vectorize) return;

  executionCtx.waitUntil(
    indexSiteContent(db, ai, vectorize, kv)
      .then((r) => {
        if (r.indexed > 0 || r.errors.length > 0) {
          console.log(`[Auto-Reindex] Indexed: ${r.indexed}, Errors: ${r.errors.length}`);
        }
      })
      .catch((e) => {
        console.error("[Auto-Reindex] Failed:", e);
      })
  );
}
