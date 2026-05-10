import { describe, it, expect } from 'vitest';
import { resolveTurn } from './resolver.js';
import type { GameState, PlayerAction, Vine } from './types.js';

function makeVines(): Vine[] {
  return [
    { id: 0, value: 10, alive: true },
    { id: 1, value: 27, alive: true },
    { id: 2, value: 15, alive: true },
  ];
}

function makeState(vines?: Vine[]): GameState {
  return {
    phase: 'playing',
    vines: vines ?? makeVines(),
    scores: [0, 0],
    turn: 1,
    maxTurns: 15,
    turnResults: [],
  };
}

describe('resolveTurn', () => {
  it('both wait: no cuts, no clashes, vines step forward', () => {
    const state = makeState();
    const p1: PlayerAction = { type: 'wait' };
    const p2: PlayerAction = { type: 'wait' };

    const result = resolveTurn(state, p1, p2);

    expect(result.clashes).toEqual([]);
    expect(result.cuts).toEqual([]);
    // All vines still alive
    expect(result.vinesAfterStep.every((v) => v.alive)).toBe(true);
    // Vine 0 was 10 (even) -> 5
    expect(result.vinesAfterStep.find((v) => v.id === 0)!.value).toBe(5);
    // Vine 1 was 27 (odd) -> 82
    expect(result.vinesAfterStep.find((v) => v.id === 1)!.value).toBe(82);
    // Vine 2 was 15 (odd) -> 46
    expect(result.vinesAfterStep.find((v) => v.id === 2)!.value).toBe(46);
  });

  it('one player cuts, other waits: cutter scores', () => {
    const state = makeState();
    const p1: PlayerAction = { type: 'cut', vineId: 1 };
    const p2: PlayerAction = { type: 'wait' };

    const result = resolveTurn(state, p1, p2);

    expect(result.clashes).toEqual([]);
    expect(result.cuts).toEqual([
      { vineId: 1, playerId: 1, value: 27 },
    ]);
    // Vine 1 should be dead
    expect(result.vinesAfterStep.find((v) => v.id === 1)!.alive).toBe(false);
    // Other vines still alive and stepped
    expect(result.vinesAfterStep.find((v) => v.id === 0)!.alive).toBe(true);
    expect(result.vinesAfterStep.find((v) => v.id === 0)!.value).toBe(5);
  });

  it('both cut the same vine: clash, nobody scores, vine destroyed', () => {
    const state = makeState();
    const p1: PlayerAction = { type: 'cut', vineId: 2 };
    const p2: PlayerAction = { type: 'cut', vineId: 2 };

    const result = resolveTurn(state, p1, p2);

    expect(result.clashes).toEqual([2]);
    expect(result.cuts).toEqual([]);
    // Vine 2 is destroyed
    expect(result.vinesAfterStep.find((v) => v.id === 2)!.alive).toBe(false);
    // Its value should not have been stepped (it's dead)
    expect(result.vinesAfterStep.find((v) => v.id === 2)!.value).toBe(15);
    // Other vines alive and stepped
    expect(result.vinesAfterStep.find((v) => v.id === 0)!.alive).toBe(true);
  });

  it('both cut different vines: both score', () => {
    const state = makeState();
    const p1: PlayerAction = { type: 'cut', vineId: 0 };
    const p2: PlayerAction = { type: 'cut', vineId: 1 };

    const result = resolveTurn(state, p1, p2);

    expect(result.clashes).toEqual([]);
    expect(result.cuts).toHaveLength(2);
    expect(result.cuts).toContainEqual({ vineId: 0, playerId: 1, value: 10 });
    expect(result.cuts).toContainEqual({ vineId: 1, playerId: 2, value: 27 });
    // Both cut vines are dead
    expect(result.vinesAfterStep.find((v) => v.id === 0)!.alive).toBe(false);
    expect(result.vinesAfterStep.find((v) => v.id === 1)!.alive).toBe(false);
    // Surviving vine stepped
    expect(result.vinesAfterStep.find((v) => v.id === 2)!.alive).toBe(true);
    expect(result.vinesAfterStep.find((v) => v.id === 2)!.value).toBe(46);
  });

  it('does not mutate the original game state', () => {
    const state = makeState();
    const originalVines = state.vines.map((v) => ({ ...v }));

    resolveTurn(state, { type: 'cut', vineId: 0 }, { type: 'wait' });

    expect(state.vines).toEqual(originalVines);
  });

  it('dead vines do not step', () => {
    const vines: Vine[] = [
      { id: 0, value: 10, alive: false },
      { id: 1, value: 27, alive: true },
    ];
    const state = makeState(vines);
    const result = resolveTurn(state, { type: 'wait' }, { type: 'wait' });

    // Dead vine stays at its value
    expect(result.vinesAfterStep.find((v) => v.id === 0)!.value).toBe(10);
    // Alive vine steps
    expect(result.vinesAfterStep.find((v) => v.id === 1)!.value).toBe(82);
  });

  it('vine reaching 1 withers and a new vine sprouts', () => {
    const vines: Vine[] = [
      { id: 0, value: 2, alive: true },
      { id: 1, value: 27, alive: true },
    ];
    const state = makeState(vines);
    const result = resolveTurn(state, { type: 'wait' }, { type: 'wait' });

    // Vine 0 was 2 (even) -> 1 -> withers
    expect(result.withered).toContain(0);
    expect(result.vinesAfterStep.find((v) => v.id === 0)!.alive).toBe(false);
    // A new vine should have sprouted
    expect(result.sprouted).toHaveLength(1);
    expect(result.sprouted[0].alive).toBe(true);
    expect(result.sprouted[0].value).toBeGreaterThanOrEqual(7);
    // The new vine should be in vinesAfterStep
    const newVine = result.vinesAfterStep.find((v) => v.id === result.sprouted[0].id);
    expect(newVine).toBeDefined();
    expect(newVine!.alive).toBe(true);
  });
});
