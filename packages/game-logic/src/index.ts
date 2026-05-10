export { collatzStep, collatzSequence, collatzSequenceLength } from './collatz.js';
export { VINE_COUNT, MIN_NUMBER, MAX_NUMBER, SCORE_THRESHOLD, GAME_DURATION, TICK_INTERVAL } from './constants.js';
export { tickVines, harvest, isHarvestable } from './resolver.js';
export { generateVines, generateSingleVine } from './vine-generator.js';
export type {
  Vine,
  PlayerSlot,
  HarvestResult,
} from './types.js';
