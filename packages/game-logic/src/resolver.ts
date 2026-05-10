import { collatzStep } from './collatz.js';
import { generateSingleVine } from './vine-generator.js';
import type { GameState, PlayerAction, PlayerSlot, TurnResult, Vine } from './types.js';

export function resolveTurn(
  state: GameState,
  p1Action: PlayerAction,
  p2Action: PlayerAction,
): TurnResult {
  const clashes: number[] = [];
  const cuts: { vineId: number; playerId: PlayerSlot; value: number }[] = [];

  const vines: Vine[] = state.vines.map((v) => ({ ...v }));

  const p1Cut = p1Action.type === 'cut' ? p1Action.vineId : null;
  const p2Cut = p2Action.type === 'cut' ? p2Action.vineId : null;

  if (p1Cut !== null && p2Cut !== null && p1Cut === p2Cut) {
    const vine = vines.find((v) => v.id === p1Cut);
    if (vine && vine.alive) {
      clashes.push(vine.id);
      vine.alive = false;
    }
  } else {
    if (p1Cut !== null) {
      const vine = vines.find((v) => v.id === p1Cut);
      if (vine && vine.alive) {
        cuts.push({ vineId: vine.id, playerId: 1, value: vine.value });
        vine.alive = false;
      }
    }

    if (p2Cut !== null) {
      const vine = vines.find((v) => v.id === p2Cut);
      if (vine && vine.alive) {
        cuts.push({ vineId: vine.id, playerId: 2, value: vine.value });
        vine.alive = false;
      }
    }
  }

  // Step surviving vines through one Collatz iteration
  for (const vine of vines) {
    if (vine.alive) {
      vine.value = collatzStep(vine.value);
    }
  }

  // Vines that reached 1 wither and get replaced by fresh sprouts
  const withered: number[] = [];
  const sprouted: Vine[] = [];
  let nextId = Math.max(...vines.map((v) => v.id)) + 1;
  const existingValues = new Set(vines.filter((v) => v.alive).map((v) => v.value));

  for (const vine of vines) {
    if (vine.alive && vine.value <= 1) {
      withered.push(vine.id);
      vine.alive = false;
      const newVine = generateSingleVine(nextId++, existingValues);
      existingValues.add(newVine.value);
      sprouted.push(newVine);
      vines.push(newVine);
    }
  }

  return {
    player1Action: p1Action,
    player2Action: p2Action,
    clashes,
    cuts,
    withered,
    sprouted,
    vinesAfterStep: vines,
  };
}
