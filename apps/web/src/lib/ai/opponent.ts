import type {
  GameState,
  PlayerAction,
  Vine,
} from '@gardeners-dilemma/game-logic';
import { collatzStep } from '@gardeners-dilemma/game-logic';

export type AiDifficulty = 'seedling' | 'gardener' | 'botanist';

export function getAiAction(
  state: GameState,
  difficulty: AiDifficulty,
): PlayerAction {
  const harvestable = state.vines.filter((v) => v.alive && v.value % 2 !== 0);
  if (harvestable.length === 0) return { type: 'wait' };

  switch (difficulty) {
    case 'seedling':
      return seedlingAction(harvestable);
    case 'gardener':
      return gardenerAction(state, harvestable);
    case 'botanist':
      return botanistAction(state, harvestable);
  }
}

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
// Seedling -- cuts the highest ripe vine most of the time
// ---------------------------------------------------------------------------

function seedlingAction(harvestable: Vine[]): PlayerAction {
  if (Math.random() < 0.15) {
    return { type: 'wait' };
  }
  if (Math.random() < 0.2) {
    return cut(randomPick(harvestable));
  }
  return cut(highestValue(harvestable));
}

// ---------------------------------------------------------------------------
// Gardener -- considers whether waiting yields a bigger odd value soon
// ---------------------------------------------------------------------------

function gardenerAction(state: GameState, harvestable: Vine[]): PlayerAction {
  if (Math.random() < 0.08) {
    return cut(randomPick(harvestable));
  }

  const atPeak = harvestable.filter((vine) => {
    const futureOddPeak = nextOddPeak(vine.value, 3);
    return vine.value >= futureOddPeak;
  });

  if (atPeak.length > 0) {
    return cut(highestValue(atPeak));
  }

  // Nothing at its peak right now. Still cut 40% of the time.
  if (Math.random() < 0.4) {
    return cut(highestValue(harvestable));
  }

  return { type: 'wait' };
}

// ---------------------------------------------------------------------------
// Botanist -- deep lookahead, opponent modeling
// ---------------------------------------------------------------------------

function botanistAction(state: GameState, harvestable: Vine[]): PlayerAction {
  if (Math.random() < 0.03) {
    return cut(randomPick(harvestable));
  }

  const scored = harvestable.map((vine) => ({
    vine,
    score: botanistScore(vine),
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Check if any vine on the board will be odd and much higher soon
  const allVines = state.vines.filter((v) => v.alive);
  const bigFutureOdd = allVines.some((v) => {
    const peak = nextOddPeak(v.value, 4);
    return peak > best.vine.value * 1.5;
  });

  // If something much bigger is coming soon, wait
  if (bigFutureOdd && Math.random() < 0.6) {
    return { type: 'wait' };
  }

  // Opponent modeling: dodge the obvious target
  if (scored.length >= 2 && isClashCandidate(scored[0].vine, harvestable)) {
    if (Math.random() < 0.45) {
      return cut(scored[1].vine);
    }
  }

  return cut(best.vine);
}

function botanistScore(vine: Vine): number {
  const futureOddPeak = nextOddPeak(vine.value, 5);
  if (futureOddPeak === 0) return 0;
  const peakProximity = vine.value / futureOddPeak;
  return vine.value * peakProximity;
}

function isClashCandidate(vine: Vine, harvestable: Vine[]): boolean {
  if (harvestable.length < 2) return false;
  const sorted = [...harvestable].sort((a, b) => b.value - a.value);
  return sorted[0].id === vine.id && sorted[0].value > sorted[1].value * 1.3;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextOddPeak(value: number, steps: number): number {
  let current = value;
  let maxOdd = value % 2 !== 0 ? value : 0;
  for (let i = 0; i < steps; i++) {
    current = collatzStep(current);
    if (current % 2 !== 0) {
      maxOdd = Math.max(maxOdd, current);
    }
  }
  return maxOdd;
}

function cut(vine: Vine): PlayerAction {
  return { type: 'cut', vineId: vine.id };
}

function highestValue(vines: Vine[]): Vine {
  return vines.reduce((best, v) => (v.value > best.value ? v : best));
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
