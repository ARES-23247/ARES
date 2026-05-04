import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

/**
 * ARES PartyKit Yjs Server
 * 
 * Provides real-time collaborative editing via WebSocket + Yjs CRDT.
 * PartyKit's built-in persistence handles Yjs document state automatically.
 * 
 * D1 snapshot persistence requires cloud-prem deployment — deferred to v6.1.
 */
export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}

  async onConnect(conn: Party.Connection) {
    await onConnect(conn, this.room, {
      persist: true,
    });
  }
}
