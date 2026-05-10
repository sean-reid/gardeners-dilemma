import { writable } from 'svelte/store';
import type { GameState, Vine } from '@gardeners-dilemma/game-logic';

const initialState: GameState = {
	phase: 'waiting',
	vines: [],
	scores: [0, 0],
	turn: 0,
	maxTurns: 15,
	turnResults: []
};

export const gameState = writable<GameState>({ ...initialState });

export function resetGame(): void {
	gameState.set({ ...initialState, turnResults: [] });
}

export function updateVines(vines: Vine[]): void {
	gameState.update((state) => ({ ...state, vines }));
}

export function addScore(playerIndex: 0 | 1, points: number): void {
	gameState.update((state) => {
		const scores: [number, number] = [...state.scores];
		scores[playerIndex] += points;
		return { ...state, scores };
	});
}

export function nextTurn(): void {
	gameState.update((state) => ({
		...state,
		turn: state.turn + 1,
		phase: state.turn + 1 >= state.maxTurns ? 'gameover' : 'playing'
	}));
}
