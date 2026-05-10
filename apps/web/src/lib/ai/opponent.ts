import type {
  GameState,
  PlayerAction,
  Vine,
} from '@gardeners-dilemma/game-logic';
import { collatzStep } from '@gardeners-dilemma/game-logic';

export type AiDifficulty = 'seedling' | 'gardener' | 'botanist';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Choose the AI's action for the current turn.
 * The AI is always player 2.
 */
export function getAiAction(
  state: GameState,
  difficulty: AiDifficulty,
): PlayerAction {
  const alive = state.vines.filter((v) => v.alive);
  if (alive.length === 0) return { type: 'wait' };

  switch (difficulty) {
    case 'seedling':
      return seedlingAction(state, alive);
    case 'gardener':
      return gardenerAction(state, alive);
    case 'botanist':
      return botanistAction(state, alive);
  }
}

/**
 * Return a random "thinking" delay in milliseconds that feels natural
 * for the given difficulty.
 */
export function getAiThinkingDelay(difficulty: AiDifficulty): number {
  switch (difficulty) {
    case 'seedling':
      return randomBetween(500, 1500);
    case 'gardener':
      return randomBetween(1000, 3000);
    case 'botanist':
      return randomBetween(2000, 4000);
  }
}

// ---------------------------------------------------------------------------
// Seedling (easy) -- looks 1 step ahead
// ---------------------------------------------------------------------------

function seedlingAction(state: GameState, alive: Vine[]): PlayerAction {
  const turnsRemaining = state.maxTurns - state.turn + 1;
  const urgent = turnsRemaining <= 3;

  // A vine is "ripe" if its value is even (will shrink on the next step).
  const ripe = alive.filter((v) => v.value % 2 === 0);

  const roll = Math.random();

  if (urgent) {
    // Last few turns -- always try to cut something.
    if (ripe.length > 0) {
      return cut(highestValue(ripe));
    }
    return cut(highestValue(alive));
  }

  if (roll < 0.6 && ripe.length > 0) {
    // 60% -- cut the highest-value ripe vine
    return cut(highestValue(ripe));
  } else if (roll < 0.8) {
    // 20% -- cut a random alive vine
    return cut(randomPick(alive));
  } else {
    // 20% -- wait
    return { type: 'wait' };
  }
}

// ---------------------------------------------------------------------------
// Gardener (medium) -- looks 2-3 steps ahead
// ---------------------------------------------------------------------------

function gardenerAction(state: GameState, alive: Vine[]): PlayerAction {
  // 10% random noise
  if (Math.random() < 0.1) {
    return Math.random() < 0.5
      ? cut(randomPick(alive))
      : { type: 'wait' };
  }

  const harvestVines = getHarvestWindowVines(alive, 3);

  if (harvestVines.length > 0) {
    // Cut the vine at its harvest window with the highest current value.
    return cut(highestValue(harvestVines));
  }

  // No vine is at its harvest window -- wait for values to rise.
  return { type: 'wait' };
}

/**
 * Return the subset of vines whose current value is the peak over the
 * next `steps` Collatz iterations (the "harvest window").
 */
function getHarvestWindowVines(vines: Vine[], steps: number): Vine[] {
  return vines.filter((vine) => {
    const future = simulateSteps(vine.value, steps);
    const peak = Math.max(...future);
    // The vine is at its harvest window if the current value is the peak.
    return vine.value >= peak;
  });
}

// ---------------------------------------------------------------------------
// Botanist (hard) -- looks 5 steps ahead, opponent modeling
// ---------------------------------------------------------------------------

function botanistAction(state: GameState, alive: Vine[]): PlayerAction {
  const turnsRemaining = state.maxTurns - state.turn + 1;
  const lateTurn = state.turn > 12;
  const moreVinesThanTurns = alive.length > turnsRemaining;

  // 5% random noise
  if (Math.random() < 0.05) {
    return Math.random() < 0.5
      ? cut(randomPick(alive))
      : { type: 'wait' };
  }

  // Score each vine.
  const scored = alive.map((vine) => ({
    vine,
    score: botanistScore(vine),
  }));

  // Sort descending by score.
  scored.sort((a, b) => b.score - a.score);

  // Late-game aggression: if more vines remain than turns, always cut.
  const aggressive = lateTurn || moreVinesThanTurns;

  const best = scored[0];

  // If nothing is worth cutting and we are not in a rush, wait.
  if (best.score <= 0 && !aggressive) {
    return { type: 'wait' };
  }

  // Opponent modeling: the highest-value vine is tempting for the human too.
  // Avoid it 40% of the time to dodge clashes.
  if (scored.length >= 2 && isClashCandidate(scored[0].vine, alive)) {
    if (Math.random() < 0.4) {
      return cut(scored[1].vine);
    }
  }

  return cut(best.vine);
}

/**
 * Compute a heuristic value score for a vine, weighting current value by
 * proximity to a local peak over the next 5 steps.
 */
function botanistScore(vine: Vine): number {
  const lookahead = 5;
  const future = simulateSteps(vine.value, lookahead);
  const peak = Math.max(...future);

  if (peak === 0) return 0;

  // Ratio of current value to peak: 1.0 means we are at the peak right now.
  const peakProximity = vine.value / peak;

  // Combine current value with how close we are to the peak.
  // A vine worth 20 at its peak is better than a vine worth 100 that will
  // grow to 300 (proximity ~ 0.33).
  return vine.value * peakProximity;
}

/**
 * A vine is a clash candidate if it is the single highest-value alive vine
 * by a meaningful margin, making it the obvious pick for both players.
 */
function isClashCandidate(vine: Vine, alive: Vine[]): boolean {
  if (alive.length < 2) return false;
  const sorted = [...alive].sort((a, b) => b.value - a.value);
  // The vine must be the most valuable, and at least 20% higher than the
  // runner-up to be considered an obvious target.
  return (
    sorted[0].id === vine.id &&
    sorted[0].value > sorted[1].value * 1.2
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate `steps` Collatz iterations from a starting value. */
function simulateSteps(value: number, steps: number): number[] {
  const results: number[] = [value];
  let current = value;
  for (let i = 0; i < steps; i++) {
    current = collatzStep(current);
    results.push(current);
  }
  return results;
}

/** Build a cut action for a vine. */
function cut(vine: Vine): PlayerAction {
  return { type: 'cut', vineId: vine.id };
}

/** Return the vine with the highest value. */
function highestValue(vines: Vine[]): Vine {
  return vines.reduce((best, v) => (v.value > best.value ? v : best));
}

/** Return a random element from an array. */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Return a random integer in [min, max] inclusive. */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
