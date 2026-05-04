import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import * as Y from "yjs";

/**
 * ARES PartyKit Yjs Server (Cloudflare Worker Mode)
 *
 * Provides real-time collaborative editing via WebSocket + Yjs CRDT.
 * This version runs as a Cloudflare Worker with D1 snapshot persistence.
 *
 * D1 Binding: PK_DB (wrangler.toml)
 * Table: document_snapshots (schema.sql)
 */

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room, public env: any) {}

  async onConnect(conn: Party.Connection) {
    // Initialize D1 snapshot persistence
    const db = this.env.PK_DB as D1Database;

    await onConnect(conn, this.room, {
      // Custom load function to restore from D1 snapshot
      load: async (): Promise<Y.Doc | null> => {
        try {
          const result = await db
            .prepare("SELECT state FROM document_snapshots WHERE room_id = ?")
            .bind(this.room.id)
            .first<{ state: string }>();

          if (result?.state) {
            // Decode base64 to Uint8Array
            const binary = Uint8Array.from(atob(result.state), c => c.charCodeAt(0));
            // Create a new Y.Doc and apply the state
            const doc = new Y.Doc();
            Y.applyUpdate(doc, binary);
            return doc;
          }
          return null;
        } catch (err) {
          console.error(`[PartyKit] Failed to load snapshot for room ${this.room.id}:`, err);
          return null;
        }
      },
      // Persist mode: snapshot saves full state when last client disconnects
      persist: {
        mode: "snapshot",
      },
      // Disable GC when persisting to maintain document integrity
      gc: false,
      // Callback to save snapshot to D1 after each snapshot
      callback: {
        debounceWait: 1000, // Save at most once per second
        handler: async (doc: Y.Doc) => {
          try {
            // Encode document state as Uint8Array
            const state = Y.encodeStateAsUpdate(doc);
            // Convert to base64 for D1 BLOB storage
            const base64 = btoa(String.fromCharCode(...state));

            await db
              .prepare(`
                INSERT INTO document_snapshots (room_id, state, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(room_id) DO UPDATE SET
                  state = excluded.state,
                  updated_at = CURRENT_TIMESTAMP
              `)
              .bind(this.room.id, base64)
              .run();
          } catch (err) {
            console.error(`[PartyKit] Failed to save snapshot for room ${this.room.id}:`, err);
          }
        },
      },
    });
  }
}

// Extend Party.Server to include the D1 binding
interface Env {
  PK_DB: D1Database;
}
