<script lang="ts">
	import {
		generateVines,
		resolveTurn,
		MAX_TURNS,
		TIMER_SECONDS,
		SCORE_THRESHOLD,
	} from '@gardeners-dilemma/game-logic';
	import type {
		Vine,
		GameState,
		PlayerAction,
		TurnResult,
		PlayerSlot,
	} from '@gardeners-dilemma/game-logic';
	import { getAiAction, getAiThinkingDelay, type AiDifficulty } from '$lib/ai/opponent';

	import VineRow from '$lib/components/VineRow.svelte';
	import ScoreBar from '$lib/components/ScoreBar.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import RevealOverlay from '$lib/components/RevealOverlay.svelte';
	import GameOver from '$lib/components/GameOver.svelte';

	type Screen = 'difficulty' | 'playing' | 'gameover';

	let screen = $state<Screen>('difficulty');
	let difficulty = $state<AiDifficulty>('gardener');

	let gameState = $state<GameState>({
		phase: 'waiting',
		vines: [],
		scores: [0, 0],
		turn: 1,
		maxTurns: MAX_TURNS,
		turnResults: [],
	});

	let selectedVineId = $state<number | null>(null);
	let locked = $state(false);
	let timerRunning = $state(false);
	let timerKey = $state(0);
	let showReveal = $state(false);
	let currentResult = $state<TurnResult | null>(null);
	let winner = $state<PlayerSlot | 'draw' | null>(null);

	const PLAYER_SLOT: PlayerSlot = 1;

	function startGame(diff: AiDifficulty) {
		difficulty = diff;
		gameState = {
			phase: 'playing',
			vines: generateVines(),
			scores: [0, 0],
			turn: 1,
			maxTurns: MAX_TURNS,
			turnResults: [],
		};
		selectedVineId = null;
		locked = false;
		showReveal = false;
		currentResult = null;
		winner = null;
		screen = 'playing';
		startTurn();
	}

	function startTurn() {
		selectedVineId = null;
		locked = false;
		showReveal = false;
		currentResult = null;
		timerKey += 1;
		timerRunning = true;
	}

	function submitAction(action: PlayerAction) {
		if (locked) return;
		locked = true;
		timerRunning = false;

		const aiDelay = getAiThinkingDelay(difficulty);
		const aiAction = getAiAction(gameState, difficulty);

		setTimeout(() => {
			resolve(action, aiAction);
		}, aiDelay);
	}

	function handleCut(vineId: number) {
		submitAction({ type: 'cut', vineId });
	}

	function handleWait() {
		submitAction({ type: 'wait' });
	}

	function handleTimerExpire() {
		submitAction({ type: 'wait' });
	}

	function resolve(playerAction: PlayerAction, aiAction: PlayerAction) {
		const result = resolveTurn(gameState, playerAction, aiAction);

		for (const cut of result.cuts) {
			gameState.scores[cut.playerId - 1] += cut.value;
		}

		gameState.vines = result.vinesAfterStep;
		gameState.turnResults = [...gameState.turnResults, result];

		currentResult = result;
		showReveal = true;
	}

	function handleRevealDismiss() {
		showReveal = false;

		const isGameOver =
			gameState.turn >= gameState.maxTurns ||
			gameState.scores[0] >= SCORE_THRESHOLD ||
			gameState.scores[1] >= SCORE_THRESHOLD;

		if (isGameOver) {
			if (gameState.scores[0] > gameState.scores[1]) {
				winner = 1;
			} else if (gameState.scores[1] > gameState.scores[0]) {
				winner = 2;
			} else {
				winner = 'draw';
			}
			screen = 'gameover';
		} else {
			gameState.turn += 1;
			startTurn();
		}
	}

	function handleRematch() {
		startGame(difficulty);
	}

	function handleHome() {
		window.location.href = '/';
	}

	let selectedVineValue = $derived(
		selectedVineId !== null
			? gameState.vines.find((v) => v.id === selectedVineId)?.value ?? null
			: null
	);
</script>

<svelte:head>
	<title>Solo Play - Gardener's Dilemma</title>
</svelte:head>

{#if screen === 'difficulty'}
	<main class="flex flex-col items-center justify-center min-h-screen px-6 py-12">
		<div class="w-full max-w-md space-y-10 text-center">
			<header class="space-y-2">
				<h1 class="font-display text-4xl font-semibold text-forest">Solo Play</h1>
				<p class="text-warmgray">Choose your difficulty</p>
			</header>

			<div class="space-y-3">
				{#each [
					{ id: 'seedling' as AiDifficulty, label: 'Seedling', desc: 'The AI plays conservatively. A good place to learn the ropes.' },
					{ id: 'gardener' as AiDifficulty, label: 'Gardener', desc: 'Balanced play. The AI will punish obvious mistakes.' },
					{ id: 'botanist' as AiDifficulty, label: 'Botanist', desc: 'Ruthless optimization. Good luck.' },
				] as option (option.id)}
					<button
						onclick={() => startGame(option.id)}
						class="block w-full rounded-xl border-2 px-6 py-4 text-left transition-colors cursor-pointer
							border-warmgray/30 hover:border-sage/60 hover:bg-sage/5 active:bg-sage/10"
					>
						<span class="text-lg font-semibold font-display">{option.label}</span>
						<span class="block text-sm text-warmgray mt-1">{option.desc}</span>
					</button>
				{/each}
			</div>

			<a href="/" class="inline-block text-sm text-warmgray hover:text-bark transition-colors">
				&#8592; Back
			</a>
		</div>
	</main>
{:else if screen === 'playing'}
	<main class="flex flex-col min-h-screen max-w-lg mx-auto">
		<div class="px-4 pt-4 space-y-3">
			<ScoreBar
				scores={gameState.scores}
				turn={gameState.turn}
				maxTurns={gameState.maxTurns}
				playerSlot={PLAYER_SLOT}
			/>

			{#key timerKey}
				<Timer
					seconds={TIMER_SECONDS}
					maxSeconds={TIMER_SECONDS}
					running={timerRunning}
					onexpire={handleTimerExpire}
				/>
			{/key}
		</div>

		<div class="flex-1 flex items-end px-2 pb-4">
			<VineRow
				vines={gameState.vines}
				{selectedVineId}
				disabled={locked}
				turnResult={showReveal ? currentResult : null}
				playerSlot={PLAYER_SLOT}
				onselect={(id) => { selectedVineId = id; }}
			/>
		</div>

		<ActionBar
			{selectedVineId}
			{selectedVineValue}
			{locked}
			disabled={!timerRunning && !locked}
			oncut={handleCut}
			onwait={handleWait}
		/>
	</main>

	{#if showReveal && currentResult}
		<RevealOverlay
			result={currentResult}
			playerSlot={PLAYER_SLOT}
			ondismiss={handleRevealDismiss}
		/>
	{/if}
{:else if screen === 'gameover' && winner !== null}
	<GameOver
		{winner}
		scores={gameState.scores}
		playerSlot={PLAYER_SLOT}
		onrematch={handleRematch}
		onhome={handleHome}
	/>
{/if}
