import type * as Party from "partykit/server";

export default class KanbanServer implements Party.Server {
  constructor(public room: Party.Room) {}

  async onConnect() {
    // We don't need any special connection logic since we are just doing pub-sub.
    // However, if we wanted to sync state we could do it here.
  }

  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    // Kanban messages should all be JSON strings
    if (typeof message !== "string") return;

    try {
      // Validate that it's valid JSON
      JSON.parse(message);
      
      // Broadcast to all *other* connections in this room
      this.room.broadcast(message, [sender.id]);
    } catch {
      console.error("[KanbanServer] Received invalid JSON:", message);
    }
  }
}
