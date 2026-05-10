import { VINE_COUNT, MIN_NUMBER, MAX_NUMBER } from './constants.js';
import { collatzSequenceLength } from './collatz.js';
import type { Vine } from './types.js';

export function generateSingleVine(id: number, exclude: Set<number> = new Set()): Vine {
  const candidates: number[] = [];
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    if (isPowerOfTwo(n)) continue;
    if (exclude.has(n)) continue;
    candidates.push(n);
  }
  const value = candidates[Math.floor(Math.random() * candidates.length)];
  return { id, value, alive: true };
}

/**
 * Returns true if n is a power of 2.
 */
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Generate a set of vines with random Collatz-interesting numbers.
 *
 * Constraints:
 * - All values in [MIN_NUMBER, MAX_NUMBER]
 * - No powers of 2 (they resolve too quickly and trivially)
 * - At least 2 vines with sequence length > 30 ("slow burners")
 * - At least 2 vines with sequence length < 15 ("quick resolvers")
 * - All values are unique
 */
export function generateVines(count: number = VINE_COUNT): Vine[] {
  // Pre-compute candidate pools
  const longCandidates: number[] = [];
  const shortCandidates: number[] = [];
  const midCandidates: number[] = [];

  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    if (isPowerOfTwo(n)) continue;
    const len = collatzSequenceLength(n);
    if (len > 30) {
      longCandidates.push(n);
    } else if (len < 15) {
      shortCandidates.push(n);
    } else {
      midCandidates.push(n);
    }
  }

  const chosen = new Set<number>();
  const vines: Vine[] = [];

  function pickFrom(pool: number[]): number {
    const available = pool.filter((n) => !chosen.has(n));
    const idx = Math.floor(Math.random() * available.length);
    const val = available[idx];
    chosen.add(val);
    return val;
  }

  // Ensure at least 2 long-sequence vines
  for (let i = 0; i < 2; i++) {
    vines.push({ id: vines.length, value: pickFrom(longCandidates), alive: true });
  }

  // Ensure at least 2 short-sequence vines
  for (let i = 0; i < 2; i++) {
    vines.push({ id: vines.length, value: pickFrom(shortCandidates), alive: true });
  }

  // Fill the rest from all remaining candidates
  const allRemaining = [
    ...longCandidates,
    ...shortCandidates,
    ...midCandidates,
  ];
  while (vines.length < count) {
    vines.push({ id: vines.length, value: pickFrom(allRemaining), alive: true });
  }

  // Shuffle so the guaranteed long/short vines aren't always at the front
  for (let i = vines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap values but keep ids sequential
    const tmpValue = vines[i].value;
    vines[i].value = vines[j].value;
    vines[j].value = tmpValue;
  }

  // Reassign ids to be sequential after shuffle
  vines.forEach((v, i) => {
    v.id = i;
  });

  return vines;
}
