import { VINE_COUNT, MIN_NUMBER, MAX_NUMBER } from './constants.js';
import type { Vine } from './types.js';

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function getCandidates(exclude: Set<number> = new Set()): number[] {
  const candidates: number[] = [];
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    if (isPowerOfTwo(n)) continue;
    if (exclude.has(n)) continue;
    candidates.push(n);
  }
  return candidates;
}

export function generateSingleVine(id: number, exclude: Set<number> = new Set()): Vine {
  const candidates = getCandidates(exclude);
  const value = candidates[Math.floor(Math.random() * candidates.length)];
  return { id, value, alive: true };
}

export function generateVines(count: number = VINE_COUNT): Vine[] {
  const candidates = getCandidates();
  const vines: Vine[] = [];
  const used = new Set<number>();

  while (vines.length < count && vines.length < candidates.length) {
    const available = candidates.filter((n) => !used.has(n));
    const value = available[Math.floor(Math.random() * available.length)];
    used.add(value);
    vines.push({ id: vines.length, value, alive: true });
  }

  return vines;
}
