import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import * as Y from "yjs";

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Basic y-partykit setup
    await onConnect(conn, this.room, {
      persist: true, // We can hook into persistence below
      callback: {
        handler: async (doc) => {
          // Sync to D1 Database
          const state = Y.encodeStateAsUpdate(doc);
          const d1 = this.room.context.bindings.DB as D1Database | undefined;
          
          if (d1) {
            // Upsert snapshot to our D1 database based on room ID
            const roomId = this.room.id;
            try {
              // Note: We need a valid schema for snapshots, e.g. "document_snapshots"
              await d1.prepare(
                `INSERT INTO document_snapshots (room_id, state, updated_at) 
                 VALUES (?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(room_id) DO UPDATE SET state = excluded.state, updated_at = CURRENT_TIMESTAMP`
              ).bind(roomId, state.buffer).run();
            } catch (err) {
              console.error("Failed to sync to D1", err);
            }
          }
        }
      }
    });
  }
}
