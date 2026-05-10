<script lang="ts">
	import { page } from '$app/state';
	import { SCORE_THRESHOLD } from '@gardeners-dilemma/game-logic';
	import type { Vine, PlayerSlot, HarvestResult } from '@gardeners-dilemma/game-logic';
	import PartySocket from 'partysocket';

	import VineRow from '$lib/components/VineRow.svelte';
	import ScoreBar from '$lib/components/ScoreBar.svelte';
	import GameOver from '$lib/components/GameOver.svelte';

	const code = $derived(page.params.code.toUpperCase());
	const COOLDOWN_MS = 3000;

	type Screen = 'connecting' | 'waiting' | 'playing' | 'gameover' | 'error';

	let screen = $state<Screen>('connecting');
	let errorMessage = $state('');
	let mySlot = $state<PlayerSlot>(1);

	let vines = $state<Vine[]>([]);
	let scores = $state<[number, number]>([0, 0]);
	let timeLeft = $state(0);
	let winner = $state<PlayerSlot | 'draw' | null>(null);

	let playerCooldownUntil = $state(0);
	let playerCooldown = $state(0);
	let cooldownTimer: ReturnType<typeof setInterval> | null = null;

	let lastHarvest = $state<{ playerId: PlayerSlot; value: number } | null>(null);
	let harvestFadeTimer: ReturnType<typeof setTimeout> | null = null;

	let socket: PartySocket | null = null;

	$effect(() => {
		const partyHost = import.meta.env.VITE_PARTY_HOST || 'localhost:1999';
		socket = new PartySocket({
			host: partyHost,
			room: code.toLowerCase(),
		});

		socket.addEventListener('message', (event) => {
			const msg = JSON.parse(event.data);
			handleServerMessage(msg);
		});

		socket.addEventListener('close', () => {
			if (screen === 'playing') {
				screen = 'error';
				errorMessage = 'Disconnected from server';
			}
		});

		cooldownTimer = setInterval(() => {
			const now = Date.now();
			const remaining = playerCooldownUntil - now;
			playerCooldown = remaining > 0 ? remaining / COOLDOWN_MS : 0;
		}, 50);

		return () => {
			socket?.close();
			if (cooldownTimer) clearInterval(cooldownTimer);
			if (harvestFadeTimer) clearTimeout(harvestFadeTimer);
		};
	});

	function handleServerMessage(msg: any) {
		switch (msg.type) {
			case 'assigned':
				mySlot = msg.slot;
				screen = 'waiting';
				break;

			case 'state':
				vines = msg.state.vines;
				scores = msg.state.scores;
				timeLeft = msg.state.timeLeft;
				if (msg.state.phase === 'playing' && screen !== 'gameover') {
					screen = 'playing';
				} else if (msg.state.phase === 'waiting') {
					screen = 'waiting';
				}
				break;

			case 'harvested':
				showHarvestPopup(msg.result);
				if (msg.result.playerId === mySlot) {
					playerCooldownUntil = Date.now() + COOLDOWN_MS;
					playerCooldown = 1;
				}
				break;

			case 'gameover':
				winner = msg.winner;
				scores = msg.scores;
				screen = 'gameover';
				break;

			case 'error':
				screen = 'error';
				errorMessage = msg.message;
				break;
		}
	}

	function handleVineClick(vineId: number) {
		if (screen !== 'playing') return;
		if (Date.now() < playerCooldownUntil) return;
		socket?.send(JSON.stringify({ type: 'harvest', vineId }));
	}

	function showHarvestPopup(result: HarvestResult) {
		lastHarvest = {
			playerId: result.playerId,
			value: result.value,
		};
		if (harvestFadeTimer) clearTimeout(harvestFadeTimer);
		harvestFadeTimer = setTimeout(() => { lastHarvest = null; }, 1200);
	}

	let playerOnCooldown = $derived(playerCooldown > 0);

	function handleHome() { window.location.href = '/'; }
</script>

<svelte:head>
	<title>Game {code} - Gardener's Dilemma</title>
</svelte:head>

{#if screen === 'connecting'}
	<main class="flex flex-col items-center justify-center min-h-screen px-6 py-12">
		<div class="w-full max-w-md space-y-6 text-center">
			<h1 class="font-display text-4xl font-semibold text-forest">Connecting...</h1>
		</div>
	</main>

{:else if screen === 'waiting'}
	<main class="flex flex-col items-center justify-center min-h-screen px-6 py-12">
		<div class="w-full max-w-md space-y-10 text-center">
			<header class="space-y-2">
				<h1 class="font-display text-4xl font-semibold text-forest">Waiting for opponent</h1>
				<p class="text-warmgray">Share this code with a friend</p>
			</header>

			<div class="rounded-2xl border-2 border-warmgray/20 bg-white/50 px-8 py-6">
				<p class="text-sm font-mono text-warmgray uppercase tracking-wide mb-2">Room Code</p>
				<p class="text-5xl font-mono font-semibold text-indigo tracking-[0.3em]">{code}</p>
			</div>

			<p class="text-sm text-warmgray">You are Player {mySlot}</p>

			<a href="/" class="inline-block text-sm text-warmgray hover:text-bark transition-colors">
				&#8592; Back
			</a>
		</div>
	</main>

{:else if screen === 'playing'}
	<main class="flex flex-col min-h-screen max-w-lg mx-auto">
		<div class="px-4 pt-4 space-y-3">
			<ScoreBar
				{scores}
				{timeLeft}
				playerSlot={mySlot}
			/>
		</div>

		<div class="flex-1 flex items-end px-2 pb-4">
			<VineRow
				{vines}
				disabled={playerOnCooldown}
				playerSlot={mySlot}
				onharvest={handleVineClick}
			/>
		</div>

		{#if playerOnCooldown}
			<div class="px-4 pb-4" role="status" aria-label="Harvest cooldown active">
				<div class="h-2 bg-warmgray/20 rounded-full overflow-hidden" aria-hidden="true">
					<div
						class="h-full bg-terracotta/50 rounded-full transition-none"
						style="width: {playerCooldown * 100}%"
					></div>
				</div>
			</div>
		{/if}

		{#if lastHarvest}
			<div
				class="fixed top-1/3 left-1/2 -translate-x-1/2 pointer-events-none
					text-2xl font-display font-bold harvest-popup
					{lastHarvest.playerId === mySlot ? 'text-terracotta' : 'text-indigo'}"
				role="status"
				aria-live="polite"
			>
				+{lastHarvest.value}
			</div>
		{/if}
	</main>

{:else if screen === 'gameover' && winner !== null}
	<GameOver
		{winner}
		{scores}
		playerSlot={mySlot}
		onrematch={() => { window.location.reload(); }}
		onhome={handleHome}
	/>

{:else if screen === 'error'}
	<main class="flex flex-col items-center justify-center min-h-screen px-6 py-12">
		<div class="w-full max-w-md space-y-6 text-center">
			<h1 class="font-display text-3xl font-semibold text-burgundy">{errorMessage}</h1>
			<a href="/" class="inline-block text-sm text-warmgray hover:text-bark transition-colors">
				&#8592; Home
			</a>
		</div>
	</main>
{/if}

<style>
	.harvest-popup {
		animation: float-up 1.2s ease-out forwards;
	}

	@keyframes float-up {
		0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
		70% { opacity: 1; transform: translate(-50%, -60px) scale(1.2); }
		100% { opacity: 0; transform: translate(-50%, -80px) scale(0.9); }
	}
</style>
