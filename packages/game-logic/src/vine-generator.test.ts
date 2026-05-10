import { describe, it, expect } from 'vitest';
import { generateVines } from './vine-generator.js';
import { MIN_NUMBER, MAX_NUMBER, VINE_COUNT } from './constants.js';

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

describe('generateVines', () => {
  it('generates the default number of vines', () => {
    const vines = generateVines();
    expect(vines).toHaveLength(VINE_COUNT);
  });

  it('generates a custom count of vines', () => {
    const vines = generateVines(3);
    expect(vines).toHaveLength(3);
  });

  it('all vine values are within the allowed range', () => {
    const vines = generateVines();
    for (const vine of vines) {
      expect(vine.value).toBeGreaterThanOrEqual(MIN_NUMBER);
      expect(vine.value).toBeLessThanOrEqual(MAX_NUMBER);
    }
  });

  it('no vine values are powers of 2', () => {
    for (let i = 0; i < 20; i++) {
      const vines = generateVines();
      for (const vine of vines) {
        expect(isPowerOfTwo(vine.value)).toBe(false);
      }
    }
  });

  it('all vines start alive', () => {
    const vines = generateVines();
    for (const vine of vines) {
      expect(vine.alive).toBe(true);
    }
  });

  it('vine ids are sequential starting from 0', () => {
    const vines = generateVines();
    vines.forEach((vine, i) => {
      expect(vine.id).toBe(i);
    });
  });

  it('all vine values are unique', () => {
    for (let i = 0; i < 20; i++) {
      const vines = generateVines();
      const values = vines.map((v) => v.value);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});
