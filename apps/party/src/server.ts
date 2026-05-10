import type * as Party from "partykit/server";
import {
  generateVines,
  tickVines,
  harvest,
  isHarvestable,
  isChainConnected,
  getChainMultiplier,
  SCORE_THRESHOLD,
  GAME_DURATION,
  TICK_INTERVAL,
} from "@gardeners-dilemma/game-logic";
import type { Vine, PlayerSlot, HarvestResult } from "@gardeners-dilemma/game-logic";

type Phase = "waiting" | "playing" | "gameover";

interface ChainState {
  lastValue: number | null;
  length: number;
}

interface ServerState {
  phase: Phase;
  vines: Vine[];
  scores: [number, number];
  timeLeft: number;
  cooldownUntil: [number, number];
  chains: [ChainState, ChainState];
  winner: PlayerSlot | "draw" | null;
}

type ClientMessage =
  | { type: "harvest"; vineId: number };

type ServerMessage =
  | { type: "assigned"; slot: PlayerSlot }
  | { type: "state"; state: ServerState }
  | { type: "harvested"; result: HarvestResult; multiplied: number; chainLength: number }
  | { type: "gameover"; winner: PlayerSlot | "draw"; scores: [number, number] }
  | { type: "error"; message: string };

const COOLDOWN_MS = 3000;

export default class GardenersDilemmaServer implements Party.Server {
  state: ServerState = {
    phase: "waiting",
    vines: [],
    scores: [0, 0],
    timeLeft: GAME_DURATION,
    cooldownUntil: [0, 0],
    chains: [{ lastValue: null, length: 0 }, { lastValue: null, length: 0 }],
    winner: null,
  };

  players: Map<string, PlayerSlot> = new Map();
  tickTimer: ReturnType<typeof setInterval> | null = null;
  clockTimer: ReturnType<typeof setInterval> | null = null;

  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection): void {
    if (this.state.phase === "gameover") {
      this.send(conn, { type: "error", message: "This game is over" });
      return;
    }

    const currentCount = this.players.size;
    if (currentCount >= 2) {
      this.send(conn, { type: "error", message: "Room is full" });
      return;
    }

    const slot: PlayerSlot = currentCount === 0 ? 1 : 2;
    this.players.set(conn.id, slot);
    this.send(conn, { type: "assigned", slot });

    if (this.players.size === 2) {
      this.startGame();
    } else {
      this.send(conn, { type: "state", state: this.state });
    }
  }

  onClose(conn: Party.Connection): void {
    const slot = this.players.get(conn.id);
    this.players.delete(conn.id);

    if (this.state.phase === "playing" && slot) {
      const winner: PlayerSlot = slot === 1 ? 2 : 1;
      this.endGame(winner);
    }
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection): void {
    if (typeof message !== "string") return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    if (this.state.phase !== "playing") return;

    const slot = this.players.get(sender.id);
    if (!slot) return;

    if (msg.type === "harvest") {
      this.handleHarvest(slot, msg.vineId);
    }
  }

  startGame(): void {
    this.state.phase = "playing";
    this.state.vines = generateVines();
    this.state.scores = [0, 0];
    this.state.timeLeft = GAME_DURATION;
    this.state.cooldownUntil = [0, 0];
    this.state.chains = [{ lastValue: null, length: 0 }, { lastValue: null, length: 0 }];
    this.state.winner = null;

    this.broadcast({ type: "state", state: this.state });

    this.tickTimer = setInterval(() => {
      if (this.state.phase !== "playing") return;
      const result = tickVines(this.state.vines);
      this.state.vines = result.vines;
      this.broadcast({ type: "state", state: this.state });
    }, TICK_INTERVAL);

    this.clockTimer = setInterval(() => {
      if (this.state.phase !== "playing") return;
      this.state.timeLeft -= 1;
      if (this.state.timeLeft <= 0) {
        this.endGame(
          this.state.scores[0] > this.state.scores[1] ? 1
          : this.state.scores[1] > this.state.scores[0] ? 2
          : "draw"
        );
      }
    }, 1000);
  }

  handleHarvest(slot: PlayerSlot, vineId: number): void {
    const now = Date.now();
    const idx = slot - 1;

    if (now < this.state.cooldownUntil[idx]) return;

    const result = harvest(this.state.vines, vineId, slot);
    if (!result.result) return;

    const chain = this.state.chains[idx];
    const value = result.result.value;
    let chained = false;

    if (chain.lastValue !== null && isChainConnected(chain.lastValue, value)) {
      chained = true;
    }

    const multiplier = chained ? getChainMultiplier(chain.length + 1) : 1;
    const multiplied = Math.round(value * multiplier);
    const newLength = chained ? chain.length + 1 : 0;

    this.state.vines = result.vines;
    this.state.scores[idx] += multiplied;
    this.state.cooldownUntil[idx] = now + COOLDOWN_MS;
    this.state.chains[idx] = { lastValue: value, length: newLength };

    this.broadcast({ type: "harvested", result: result.result, multiplied, chainLength: newLength });
    this.broadcast({ type: "state", state: this.state });

    if (this.state.scores[0] >= SCORE_THRESHOLD || this.state.scores[1] >= SCORE_THRESHOLD) {
      this.endGame(
        this.state.scores[0] >= SCORE_THRESHOLD ? 1 : 2
      );
    }
  }

  endGame(winner: PlayerSlot | "draw"): void {
    this.state.phase = "gameover";
    this.state.winner = winner;
    this.stopTimers();
    this.broadcast({
      type: "gameover",
      winner,
      scores: this.state.scores,
    });
  }

  stopTimers(): void {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
    if (this.clockTimer) { clearInterval(this.clockTimer); this.clockTimer = null; }
  }

  send(conn: Party.Connection, msg: ServerMessage): void {
    conn.send(JSON.stringify(msg));
  }

  broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const conn of this.party.getConnections()) {
      conn.send(data);
    }
  }
}

GardenersDilemmaServer satisfies Party.Worker;
