import { collatzStep } from './collatz.js';
import { generateSingleVine } from './vine-generator.js';
import type { Vine, PlayerSlot, HarvestResult } from './types.js';

export function isHarvestable(vine: Vine): boolean {
  return vine.alive;
}

export function getChainTargets(value: number, maxSteps = 25): Set<number> {
  const targets = new Set<number>();
  let current = value;
  for (let i = 0; i < maxSteps && current > 1; i++) {
    current = collatzStep(current);
    targets.add(current);
  }
  return targets;
}

export function isChainConnected(lastValue: number, candidateValue: number): boolean {
  return getChainTargets(lastValue).has(candidateValue);
}

export function getChainMultiplier(chainLength: number): number {
  return 1 + chainLength * 0.5;
}

export function tickVines(vines: Vine[]): { vines: Vine[]; withered: number[]; sprouted: Vine[] } {
  const withered: number[] = [];
  const stepped = vines.map((v) => {
    if (!v.alive) return v;
    const newValue = collatzStep(v.value);
    if (newValue <= 1) {
      withered.push(v.id);
      return { ...v, value: newValue, alive: false };
    }
    return { ...v, value: newValue };
  });

  const sprouted: Vine[] = [];
  let nextId = Math.max(...stepped.map((v) => v.id)) + 1;
  const existingValues = new Set(stepped.filter((v) => v.alive).map((v) => v.value));

  const finalVines = stepped.map((vine) => {
    if (!vine.alive) {
      const newVine = generateSingleVine(nextId++, existingValues);
      existingValues.add(newVine.value);
      sprouted.push(newVine);
      return newVine;
    }
    return vine;
  });

  return { vines: finalVines, withered, sprouted };
}

export function harvest(
  vines: Vine[],
  vineId: number,
  playerId: PlayerSlot,
): { vines: Vine[]; result: HarvestResult | null } {
  const vine = vines.find((v) => v.id === vineId);
  if (!vine || !isHarvestable(vine)) {
    return { vines, result: null };
  }

  const result: HarvestResult = {
    vineId: vine.id,
    playerId,
    value: vine.value,
  };

  const updated = vines.map((v) => (v.id === vineId ? { ...v, alive: false } : v));

  let nextId = Math.max(...updated.map((v) => v.id)) + 1;
  const existingValues = new Set(updated.filter((v) => v.alive).map((v) => v.value));
  const finalVines = updated.map((v) => {
    if (!v.alive) {
      const newVine = generateSingleVine(nextId++, existingValues);
      existingValues.add(newVine.value);
      return newVine;
    }
    return v;
  });

  return { vines: finalVines, result };
}
