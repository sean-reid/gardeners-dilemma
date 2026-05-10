<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import PartySocket from 'partysocket';
	import { TIMER_SECONDS } from '@gardeners-dilemma/game-logic';
	import type {
		GameState,
		PlayerAction,
		PlayerSlot,
		TurnResult,
		Vine,
	} from '@gardeners-dilemma/game-logic';

	import VineRow from '$lib/components/VineRow.svelte';
	import ScoreBar from '$lib/components/ScoreBar.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import RevealOverlay from '$lib/components/RevealOverlay.svelte';
	import GameOver from '$lib/components/GameOver.svelte';

	const code = $derived(page.params.code.toUpperCase());

	type Status = 'connecting' | 'waiting' | 'playing' | 'disconnected' | 'gameover';

	let status = $state<Status>('connecting');
	let playerSlot = $state<PlayerSlot>(1);
	let gameState = $state<GameState>({
		phase: 'waiting',
		vines: [],
		scores: [0, 0],
		turn: 1,
		maxTurns: 15,
		turnResults: [],
	});

	let selectedVineId = $state<number | null>(null);
	let locked = $state(false);
	let timerRunning = $state(false);
	let timerKey = $state(0);
	let showReveal = $state(false);
	let currentResult = $state<TurnResult | null>(null);
	let winner = $state<PlayerSlot | 'draw' | null>(null);
	let errorMsg = $state<string | null>(null);

	let socket: PartySocket | null = null;

	onMount(() => {
		const host = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999';

		socket = new PartySocket({
			host,
			room: code,
		});

		socket.addEventListener('message', (event) => {
			const msg = JSON.parse(event.data);
			handleServerMessage(msg);
		});

		socket.addEventListener('open', () => {
			status = 'waiting';
		});

		socket.addEventListener('close', () => {
			if (status !== 'gameover') {
				status = 'disconnected';
			}
		});

		return () => {
			socket?.close();
		};
	});

	function handleServerMessage(msg: any) {
		switch (msg.type) {
			case 'init':
				playerSlot = msg.slot;
				gameState = msg.state;
				if (gameState.phase === 'playing') {
					status = 'playing';
				} else {
					status = 'waiting';
				}
				break;

			case 'turn-start':
				status = 'playing';
				gameState.turn = msg.turn;
				gameState.vines = rebuildVines(gameState.vines, msg.vines);
				selectedVineId = null;
				locked = false;
				showReveal = false;
				currentResult = null;
				timerKey += 1;
				timerRunning = true;
				break;

			case 'turn-result':
				timerRunning = false;
				gameState.scores = msg.scores;
				currentResult = msg.result;
				gameState.vines = msg.result.vinesAfterStep;
				showReveal = true;
				break;

			case 'game-over':
				winner = msg.winner;
				gameState.scores = msg.scores;
				status = 'gameover';
				break;

			case 'opponent-disconnected':
				errorMsg = 'Opponent disconnected. Waiting for them to return...';
				timerRunning = false;
				break;

			case 'opponent-reconnected':
				errorMsg = null;
				break;

			case 'error':
				errorMsg = msg.message;
				break;
		}
	}

	function rebuildVines(existing: Vine[], alive: Vine[]): Vine[] {
		const aliveIds = new Set(alive.map((v) => v.id));
		return existing.map((v) => {
			const updated = alive.find((a) => a.id === v.id);
			if (updated) return { ...updated, alive: true };
			return { ...v, alive: false };
		}).concat(
			alive.filter((a) => !existing.some((e) => e.id === a.id))
		);
	}

	function sendAction(action: PlayerAction) {
		if (locked || !socket) return;
		locked = true;
		timerRunning = false;
		socket.send(JSON.stringify({ type: 'action', action }));
	}

	let selectedVineValue = $derived(
		selectedVineId !== null
			? gameState.vines.find((v) => v.id === selectedVineId)?.value ?? null
			: null
	);

	function handleCut(vineId: number) {
		sendAction({ type: 'cut', vineId });
	}

	function handleWait() {
		sendAction({ type: 'wait' });
	}

	function handleTimerExpire() {
		sendAction({ type: 'wait' });
	}

	function handleRevealDismiss() {
		showReveal = false;
	}

	function handleRematch() {
		if (socket) {
			socket.send(JSON.stringify({ type: 'rematch' }));
			status = 'waiting';
			winner = null;
			showReveal = false;
			currentResult = null;
			errorMsg = 'Waiting for opponent to accept rematch...';
		}
	}

	function handleHome() {
		window.location.href = '/';
	}
</script>

<svelte:head>
	<title>Game {code} - Gardener's Dilemma</title>
</svelte:head>

{#if status === 'connecting'}
	<main class="flex flex-col items-center justify-center min-h-screen px-6">
		<div class="text-center space-y-4">
			<div class="h-8 w-8 rounded-full border-4 border-sage border-t-transparent animate-spin mx-auto"></div>
			<p class="text-warmgray">Connecting...</p>
		</div>
	</main>

{:else if status === 'waiting'}
	<main class="flex flex-col items-center justify-center min-h-screen px-6 py-12">
		<div class="w-full max-w-md space-y-10 text-center">
			<header class="space-y-2">
				<h1 class="font-display text-4xl font-semibold text-forest">Game Room</h1>
				<p class="text-warmgray">Share this code with your opponent</p>
			</header>

			<div class="rounded-2xl border-2 border-warmgray/20 bg-white/50 px-8 py-6">
				<p class="text-sm font-mono text-warmgray uppercase tracking-wide mb-2">Room Code</p>
				<p class="text-5xl font-mono font-semibold text-indigo tracking-[0.3em]">{code}</p>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-center gap-3">
					<span class="inline-block h-3 w-3 rounded-full bg-sage animate-pulse"></span>
					<span class="text-warmgray">{errorMsg ?? 'Waiting for opponent...'}</span>
				</div>
			</div>

			<a href="/" class="inline-block text-sm text-warmgray hover:text-bark transition-colors">
				&#8592; Back
			</a>
		</div>
	</main>

{:else if status === 'playing'}
	<main class="flex flex-col min-h-screen max-w-lg mx-auto">
		{#if errorMsg}
			<div class="mx-4 mt-2 px-4 py-2 rounded-lg bg-burgundy/10 text-burgundy text-sm font-body text-center">
				{errorMsg}
			</div>
		{/if}

		<div class="px-4 pt-4 space-y-3">
			<ScoreBar
				scores={gameState.scores}
				turn={gameState.turn}
				maxTurns={gameState.maxTurns}
				{playerSlot}
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
				{playerSlot}
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
			{playerSlot}
			ondismiss={handleRevealDismiss}
		/>
	{/if}

{:else if status === 'disconnected'}
	<main class="flex flex-col items-center justify-center min-h-screen px-6">
		<div class="text-center space-y-4">
			<p class="text-burgundy font-display text-2xl font-semibold">Connection lost</p>
			<p class="text-warmgray">Attempting to reconnect...</p>
			<a href="/" class="inline-block text-sm text-warmgray hover:text-bark transition-colors">
				&#8592; Back to lobby
			</a>
		</div>
	</main>

{:else if status === 'gameover' && winner !== null}
	<GameOver
		{winner}
		scores={gameState.scores}
		{playerSlot}
		onrematch={handleRematch}
		onhome={handleHome}
	/>
{/if}
