import { describe, it, expect } from 'vitest';
import { tickVines, harvest, isHarvestable } from './resolver.js';
import type { Vine } from './types.js';

describe('isHarvestable', () => {
  it('odd alive vines are harvestable', () => {
    expect(isHarvestable({ id: 0, value: 27, alive: true })).toBe(true);
  });

  it('even alive vines are not harvestable', () => {
    expect(isHarvestable({ id: 0, value: 10, alive: true })).toBe(false);
  });

  it('dead vines are not harvestable', () => {
    expect(isHarvestable({ id: 0, value: 27, alive: false })).toBe(false);
  });
});

describe('tickVines', () => {
  it('steps all alive vines through Collatz', () => {
    const vines: Vine[] = [
      { id: 0, value: 10, alive: true },
      { id: 1, value: 27, alive: true },
    ];
    const result = tickVines(vines);

    expect(result.vines.find((v) => v.id === 0)!.value).toBe(5);
    expect(result.vines.find((v) => v.id === 1)!.value).toBe(82);
  });

  it('replaces vines that reach 1', () => {
    const vines: Vine[] = [
      { id: 0, value: 2, alive: true },
      { id: 1, value: 27, alive: true },
    ];
    const result = tickVines(vines);

    expect(result.withered).toContain(0);
    expect(result.sprouted).toHaveLength(1);
    expect(result.vines).toHaveLength(2);
    expect(result.vines.every((v) => v.alive)).toBe(true);
  });

  it('does not mutate input', () => {
    const vines: Vine[] = [{ id: 0, value: 10, alive: true }];
    const original = vines[0].value;
    tickVines(vines);
    expect(vines[0].value).toBe(original);
  });

  it('keeps vine count constant', () => {
    const vines: Vine[] = [
      { id: 0, value: 2, alive: true },
      { id: 1, value: 4, alive: true },
      { id: 2, value: 27, alive: true },
    ];
    const result = tickVines(vines);
    expect(result.vines).toHaveLength(3);
    expect(result.vines.every((v) => v.alive)).toBe(true);
  });
});

describe('harvest', () => {
  it('harvests an odd vine and replaces it', () => {
    const vines: Vine[] = [
      { id: 0, value: 27, alive: true },
      { id: 1, value: 10, alive: true },
    ];
    const result = harvest(vines, 0, 1);

    expect(result.result).toEqual({ vineId: 0, playerId: 1, value: 27 });
    expect(result.vines).toHaveLength(2);
    expect(result.vines.every((v) => v.alive)).toBe(true);
    expect(result.vines.find((v) => v.id === 0)).toBeUndefined();
  });

  it('rejects harvest of even vine', () => {
    const vines: Vine[] = [
      { id: 0, value: 10, alive: true },
    ];
    const result = harvest(vines, 0, 1);

    expect(result.result).toBeNull();
    expect(result.vines[0].value).toBe(10);
  });

  it('rejects harvest of nonexistent vine', () => {
    const vines: Vine[] = [
      { id: 0, value: 27, alive: true },
    ];
    const result = harvest(vines, 99, 1);
    expect(result.result).toBeNull();
  });

  it('does not mutate input', () => {
    const vines: Vine[] = [{ id: 0, value: 27, alive: true }];
    harvest(vines, 0, 1);
    expect(vines[0].alive).toBe(true);
  });
});
