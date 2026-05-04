import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

/**
 * ARES PartyKit Yjs Server (Cloudflare Worker Mode)
 *
 * Provides real-time collaborative editing via WebSocket + Yjs CRDT.
 * PartyKit's built-in persistence handles Yjs document state automatically.
 *
 * D1 snapshot persistence requires cloud-prem deployment — deferred to v6.1.
 */
export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}

  async onConnect(conn: Party.Connection) {
    // Validate room ID format to prevent potential abuse (CR-09)
    // Allow colons for namespaced rooms like "blog:post-slug" or "docs:page-name"
    const roomId = this.room.id;
    if (!/^[a-zA-Z0-9_:-]{1,100}$/.test(roomId)) {
      throw new Error(`Invalid room_id format: ${roomId}`);
    }

    await onConnect(conn, this.room, {
      persist: true,
    });
  }
}
