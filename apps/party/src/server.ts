import type * as Party from "partykit/server";
import {
  resolveTurn,
  generateVines,
  collatzStep,
  MAX_TURNS,
  TIMER_SECONDS,
  SCORE_THRESHOLD,
} from "@gardeners-dilemma/game-logic";
import type {
  GameState,
  PlayerAction,
  PlayerSlot,
  TurnResult,
  Vine,
} from "@gardeners-dilemma/game-logic";

// ---- Server-to-client message types ----

type ServerMessage =
  | {
      type: "init";
      slot: PlayerSlot;
      state: GameState;
    }
  | {
      type: "turn-start";
      turn: number;
      vines: Vine[];
      timerSeconds: number;
    }
  | {
      type: "turn-result";
      result: TurnResult;
      scores: [number, number];
    }
  | {
      type: "game-over";
      winner: PlayerSlot | "draw";
      scores: [number, number];
    }
  | { type: "opponent-disconnected" }
  | { type: "opponent-reconnected" }
  | { type: "error"; message: string };

// ---- Client-to-server message types ----

type ClientMessage =
  | { type: "action"; action: PlayerAction }
  | { type: "rematch" };

// ---- Room state ----

interface RoomState {
  players: Map<string, PlayerSlot>;
  gameState: GameState;
  actions: Map<PlayerSlot, PlayerAction>;
  turnTimer: ReturnType<typeof setTimeout> | null;
  disconnectedSlot: PlayerSlot | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  rematchVotes: Set<PlayerSlot>;
}

// ---- Helpers ----

function makeInitialGameState(): GameState {
  return {
    phase: "waiting",
    vines: [],
    scores: [0, 0],
    turn: 0,
    maxTurns: MAX_TURNS,
    turnResults: [],
  };
}

function broadcast(room: Party.Room, msg: ServerMessage): void {
  const payload = JSON.stringify(msg);
  for (const conn of room.getConnections()) {
    conn.send(payload);
  }
}

function sendTo(conn: Party.Connection, msg: ServerMessage): void {
  conn.send(JSON.stringify(msg));
}

function getSlotForConnection(
  players: Map<string, PlayerSlot>,
  connectionId: string
): PlayerSlot | undefined {
  return players.get(connectionId);
}

function getConnectionForSlot(
  room: Party.Room,
  players: Map<string, PlayerSlot>,
  slot: PlayerSlot
): Party.Connection | undefined {
  for (const conn of room.getConnections()) {
    if (players.get(conn.id) === slot) {
      return conn;
    }
  }
  return undefined;
}

function assignAvailableSlot(
  players: Map<string, PlayerSlot>
): PlayerSlot | null {
  const takenSlots = new Set(players.values());
  if (!takenSlots.has(1)) return 1;
  if (!takenSlots.has(2)) return 2;
  return null;
}

// ---- Server ----

export default class GardenersDilemmaServer implements Party.Server {
  private room: RoomState;

  constructor(readonly party: Party.Party) {
    this.room = {
      players: new Map(),
      gameState: makeInitialGameState(),
      actions: new Map(),
      turnTimer: null,
      disconnectedSlot: null,
      reconnectTimer: null,
      rematchVotes: new Set(),
    };
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext): void {
    const { players, gameState } = this.room;

    // Handle reconnection for a disconnected player
    if (this.room.disconnectedSlot !== null) {
      const returningSlot = this.room.disconnectedSlot;
      players.set(conn.id, returningSlot);
      this.room.disconnectedSlot = null;

      if (this.room.reconnectTimer !== null) {
        clearTimeout(this.room.reconnectTimer);
        this.room.reconnectTimer = null;
      }

      sendTo(conn, { type: "init", slot: returningSlot, state: gameState });

      // Notify the other player
      const otherSlot: PlayerSlot = returningSlot === 1 ? 2 : 1;
      const otherConn = getConnectionForSlot(
        this.party,
        players,
        otherSlot
      );
      if (otherConn) {
        sendTo(otherConn, { type: "opponent-reconnected" });
      }

      // If we were mid-game and waiting for actions, resend turn-start
      if (gameState.phase === "playing") {
        sendTo(conn, {
          type: "turn-start",
          turn: gameState.turn,
          vines: gameState.vines.filter((v) => v.alive),
          timerSeconds: TIMER_SECONDS,
        });
      }
      return;
    }

    // Normal join flow
    const slot = assignAvailableSlot(players);
    if (slot === null) {
      sendTo(conn, { type: "error", message: "Room is full" });
      conn.close();
      return;
    }

    players.set(conn.id, slot);
    sendTo(conn, { type: "init", slot, state: gameState });

    // If we now have 2 players, start the game
    if (players.size === 2 && gameState.phase === "waiting") {
      this.startGame();
    }
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection): void {
    const { players, gameState } = this.room;
    const slot = getSlotForConnection(players, sender.id);

    if (slot === undefined) {
      sendTo(sender, { type: "error", message: "Not a registered player" });
      return;
    }

    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(message as string) as ClientMessage;
    } catch {
      sendTo(sender, { type: "error", message: "Invalid JSON" });
      return;
    }

    switch (parsed.type) {
      case "action":
        this.handleAction(slot, parsed.action, sender);
        break;

      case "rematch":
        this.handleRematch(slot);
        break;

      default:
        sendTo(sender, { type: "error", message: "Unknown message type" });
    }
  }

  onClose(conn: Party.Connection): void {
    const { players, gameState } = this.room;
    const slot = getSlotForConnection(players, conn.id);
    players.delete(conn.id);

    if (slot === undefined) return;

    // If game is in progress, give them a window to reconnect
    if (gameState.phase === "playing" || gameState.phase === "ready") {
      this.room.disconnectedSlot = slot;

      broadcast(this.party, { type: "opponent-disconnected" });

      // 30-second reconnect window
      this.room.reconnectTimer = setTimeout(() => {
        // They did not come back; end the game
        this.room.disconnectedSlot = null;
        this.room.reconnectTimer = null;

        if (this.room.turnTimer !== null) {
          clearTimeout(this.room.turnTimer);
          this.room.turnTimer = null;
        }

        gameState.phase = "gameover";
        const winnerSlot: PlayerSlot = slot === 1 ? 2 : 1;
        broadcast(this.party, {
          type: "game-over",
          winner: winnerSlot,
          scores: gameState.scores,
        });
      }, 30_000);
    } else if (gameState.phase === "gameover") {
      // After game is over, just note they left
      this.room.disconnectedSlot = slot;
    } else {
      // In waiting phase, just clean up
      this.room.disconnectedSlot = null;
    }
  }

  // ---- Private methods ----

  private startGame(): void {
    const { gameState } = this.room;

    gameState.phase = "ready";
    gameState.vines = generateVines();
    gameState.scores = [0, 0];
    gameState.turn = 1;
    gameState.turnResults = [];

    // Brief ready phase, then immediately start playing
    gameState.phase = "playing";
    this.room.actions.clear();
    this.room.rematchVotes.clear();

    broadcast(this.party, {
      type: "turn-start",
      turn: gameState.turn,
      vines: gameState.vines.filter((v) => v.alive),
      timerSeconds: TIMER_SECONDS,
    });

    this.startTurnTimer();
  }

  private handleAction(
    slot: PlayerSlot,
    action: PlayerAction,
    sender: Party.Connection
  ): void {
    const { gameState, actions } = this.room;

    if (gameState.phase !== "playing") {
      sendTo(sender, { type: "error", message: "Game is not in progress" });
      return;
    }

    // Validate cut targets an alive vine
    if (action.type === "cut") {
      const targetVine = gameState.vines.find(
        (v) => v.id === action.vineId && v.alive
      );
      if (!targetVine) {
        sendTo(sender, {
          type: "error",
          message: "Invalid vine selection",
        });
        return;
      }
    }

    // Record the action (overwriting any previous action this turn)
    actions.set(slot, action);

    // If both players have submitted, resolve immediately
    if (actions.has(1) && actions.has(2)) {
      if (this.room.turnTimer !== null) {
        clearTimeout(this.room.turnTimer);
        this.room.turnTimer = null;
      }
      this.resolveTurnAndAdvance();
    }
  }

  private handleRematch(slot: PlayerSlot): void {
    const { gameState } = this.room;

    if (gameState.phase !== "gameover") return;

    this.room.rematchVotes.add(slot);

    // Both players want a rematch
    if (this.room.rematchVotes.has(1) && this.room.rematchVotes.has(2)) {
      this.startGame();
    }
  }

  private startTurnTimer(): void {
    this.room.turnTimer = setTimeout(() => {
      this.room.turnTimer = null;
      this.onTurnTimeout();
    }, TIMER_SECONDS * 1000);
  }

  private onTurnTimeout(): void {
    const { actions } = this.room;

    // Default missing actions to WAIT
    if (!actions.has(1)) {
      actions.set(1, { type: "wait" });
    }
    if (!actions.has(2)) {
      actions.set(2, { type: "wait" });
    }

    this.resolveTurnAndAdvance();
  }

  private resolveTurnAndAdvance(): void {
    const { gameState, actions } = this.room;

    const p1Action = actions.get(1)!;
    const p2Action = actions.get(2)!;

    // Use the game-logic resolver
    const result = resolveTurn(gameState, p1Action, p2Action);

    // Update scores based on cuts
    for (const cut of result.cuts) {
      const scoreIndex = cut.playerId === 1 ? 0 : 1;
      gameState.scores[scoreIndex] += cut.value;
    }

    // Update vines to post-resolution state (includes Collatz step)
    gameState.vines = result.vinesAfterStep;

    // Store the result in history
    gameState.turnResults.push(result);

    // Broadcast the turn result
    broadcast(this.party, {
      type: "turn-result",
      result,
      scores: gameState.scores,
    });

    // Clear actions for next turn
    actions.clear();

    const aliveVines = gameState.vines.filter((v) => v.alive);
    const isGameOver =
      gameState.turn >= gameState.maxTurns ||
      gameState.scores[0] >= SCORE_THRESHOLD ||
      gameState.scores[1] >= SCORE_THRESHOLD;

    if (isGameOver) {
      gameState.phase = "gameover";

      let winner: PlayerSlot | "draw";
      if (gameState.scores[0] > gameState.scores[1]) {
        winner = 1;
      } else if (gameState.scores[1] > gameState.scores[0]) {
        winner = 2;
      } else {
        winner = "draw";
      }

      broadcast(this.party, {
        type: "game-over",
        winner,
        scores: gameState.scores,
      });
      return;
    }

    // Advance to next turn
    gameState.turn += 1;

    broadcast(this.party, {
      type: "turn-start",
      turn: gameState.turn,
      vines: aliveVines,
      timerSeconds: TIMER_SECONDS,
    });

    this.startTurnTimer();
  }
}

GardenersDilemmaServer satisfies Party.Worker;
