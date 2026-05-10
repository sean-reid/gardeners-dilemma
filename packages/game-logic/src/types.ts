export interface Vine {
  id: number;
  value: number;
  alive: boolean;
}

export type PlayerAction =
  | { type: 'cut'; vineId: number }
  | { type: 'wait' };

export interface TurnResult {
  player1Action: PlayerAction;
  player2Action: PlayerAction;
  clashes: number[];
  cuts: { vineId: number; playerId: PlayerSlot; value: number }[];
  withered: number[];
  sprouted: Vine[];
  vinesAfterStep: Vine[];
}

export type GamePhase = 'waiting' | 'ready' | 'playing' | 'revealing' | 'gameover';

export interface GameState {
  phase: GamePhase;
  vines: Vine[];
  scores: [number, number];
  turn: number;
  maxTurns: number;
  turnResults: TurnResult[];
}

export type PlayerSlot = 1 | 2;
