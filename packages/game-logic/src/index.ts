export { collatzStep, collatzSequence, collatzSequenceLength } from './collatz.js';
export { MAX_TURNS, TIMER_SECONDS, VINE_COUNT, MIN_NUMBER, MAX_NUMBER, SCORE_THRESHOLD } from './constants.js';
export { resolveTurn } from './resolver.js';
export { generateVines, generateSingleVine } from './vine-generator.js';
export type {
  Vine,
  PlayerAction,
  TurnResult,
  GamePhase,
  GameState,
  PlayerSlot,
} from './types.js';
