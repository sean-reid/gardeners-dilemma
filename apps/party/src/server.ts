import type * as Party from "partykit/server";

export default class GardenersDilemmaServer implements Party.Server {
  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection): void {
    conn.send(JSON.stringify({ type: "error", message: "Online play coming soon" }));
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection): void {
    sender.send(JSON.stringify({ type: "error", message: "Online play coming soon" }));
  }
}

GardenersDilemmaServer satisfies Party.Worker;
