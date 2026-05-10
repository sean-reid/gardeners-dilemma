<script lang="ts">
	import {
		generateVines,
		tickVines,
		harvest,
		isHarvestable,
		isChainConnected,
		getChainTargets,
		getChainMultiplier,
		collatzStep,
		SCORE_THRESHOLD,
		GAME_DURATION,
		TICK_INTERVAL,
	} from '@gardeners-dilemma/game-logic';
	import type { Vine, PlayerSlot, HarvestResult } from '@gardeners-dilemma/game-logic';

	import VineRow from '$lib/components/VineRow.svelte';
	import ScoreBar from '$lib/components/ScoreBar.svelte';
	import GameOver from '$lib/components/GameOver.svelte';

	type AiDifficulty = 'seedling' | 'gardener' | 'botanist';
	type Screen = 'difficulty' | 'playing' | 'gameover';

	let screen = $state<Screen>('difficulty');
	let difficulty = $state<AiDifficulty>('gardener');

	let vines = $state<Vine[]>([]);
	let scores = $state<[number, number]>([0, 0]);
	let timeLeft = $state(GAME_DURATION);
	let winner = $state<PlayerSlot | 'draw' | null>(null);
	let tickProgress = $state(0);

	let tickTimer: ReturnType<typeof setInterval> | null = null;
	let clockTimer: ReturnType<typeof setInterval> | null = null;
	let progressTimer: ReturnType<typeof setInterval> | null = null;
	let aiTimer: ReturnType<typeof setTimeout> | null = null;

	let lastHarvest = $state<{ playerId: PlayerSlot; value: number; multiplied: number } | null>(null);
	let harvestFadeTimer: ReturnType<typeof setTimeout> | null = null;

	const PLAYER: PlayerSlot = 1;
	const AI: PlayerSlot = 2;
	const COOLDOWN_MS = 3000;

	let playerCooldownUntil = $state(0);
	let aiCooldownUntil = $state(0);
	let playerCooldown = $state(0);
	let cooldownTimer: ReturnType<typeof setInterval> | null = null;

	let playerChain = $state<{ lastValue: number | null; length: number }>({ lastValue: null, length: 0 });
	let aiChain = $state<{ lastValue: number | null; length: number }>({ lastValue: null, length: 0 });

	let playerMultiplier = $derived(getChainMultiplier(playerChain.length));

	function startGame(diff: AiDifficulty) {
		difficulty = diff;
		vines = generateVines();
		scores = [0, 0];
		timeLeft = GAME_DURATION;
		winner = null;
		tickProgress = 0;
		lastHarvest = null;
		playerCooldownUntil = 0;
		aiCooldownUntil = 0;
		playerCooldown = 0;
		playerChain = { lastValue: null, length: 0 };
		aiChain = { lastValue: null, length: 0 };
		screen = 'playing';

		startTimers();
	}

	function startTimers() {
		stopTimers();

		tickTimer = setInterval(() => {
			const result = tickVines(vines);
			vines = result.vines;
			tickProgress = 0;
			scheduleAiAction();
		}, TICK_INTERVAL);

		clockTimer = setInterval(() => {
			timeLeft -= 1;
			if (timeLeft <= 0) {
				endGame();
			}
		}, 1000);

		progressTimer = setInterval(() => {
			tickProgress = Math.min(tickProgress + (50 / TICK_INTERVAL), 1);
		}, 50);

		cooldownTimer = setInterval(() => {
			const now = Date.now();
			const remaining = playerCooldownUntil - now;
			playerCooldown = remaining > 0 ? remaining / COOLDOWN_MS : 0;
		}, 50);

		scheduleAiAction();
	}

	function stopTimers() {
		if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
		if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
		if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
		if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
		if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
		if (harvestFadeTimer) { clearTimeout(harvestFadeTimer); harvestFadeTimer = null; }
	}

	function handleVineClick(vineId: number) {
		if (screen !== 'playing') return;
		if (Date.now() < playerCooldownUntil) return;
		doHarvest(vineId, PLAYER);
	}

	function doHarvest(vineId: number, playerId: PlayerSlot) {
		const result = harvest(vines, vineId, playerId);
		if (!result.result) return;

		const chain = playerId === PLAYER ? playerChain : aiChain;
		const harvestedValue = result.result.value;

		let chained = false;
		if (chain.lastValue !== null && isChainConnected(chain.lastValue, harvestedValue)) {
			chained = true;
		}

		const multiplier = chained ? getChainMultiplier(chain.length + 1) : 1;
		const multipliedScore = Math.round(harvestedValue * multiplier);

		vines = result.vines;
		scores[result.result.playerId - 1] += multipliedScore;
		scores = scores;

		if (playerId === PLAYER) {
			playerChain = chained
				? { lastValue: harvestedValue, length: chain.length + 1 }
				: { lastValue: harvestedValue, length: 0 };
		} else {
			aiChain = chained
				? { lastValue: harvestedValue, length: chain.length + 1 }
				: { lastValue: harvestedValue, length: 0 };
		}

		const now = Date.now();
		if (playerId === PLAYER) {
			playerCooldownUntil = now + COOLDOWN_MS;
			playerCooldown = 1;
		} else {
			aiCooldownUntil = now + COOLDOWN_MS;
		}

		showHarvestPopup(result.result, multipliedScore);

		if (scores[0] >= SCORE_THRESHOLD || scores[1] >= SCORE_THRESHOLD) {
			endGame();
		}
	}

	function showHarvestPopup(result: HarvestResult, multipliedScore: number) {
		lastHarvest = {
			playerId: result.playerId,
			value: result.value,
			multiplied: multipliedScore,
		};
		if (harvestFadeTimer) clearTimeout(harvestFadeTimer);
		harvestFadeTimer = setTimeout(() => { lastHarvest = null; }, 1200);
	}

	let playerOnCooldown = $derived(playerCooldown > 0);

	function endGame() {
		stopTimers();
		if (scores[0] > scores[1]) {
			winner = 1;
		} else if (scores[1] > scores[0]) {
			winner = 2;
		} else {
			winner = 'draw';
		}
		screen = 'gameover';
	}

	// --- AI ---

	function scheduleAiAction() {
		if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
		if (screen !== 'playing') return;

		const delay = getAiDelay();
		aiTimer = setTimeout(() => {
			aiAct();
		}, delay);
	}

	function getAiDelay(): number {
		switch (difficulty) {
			case 'seedling': return randomBetween(1500, 3000);
			case 'gardener': return randomBetween(800, 2000);
			case 'botanist': return randomBetween(300, 1000);
		}
	}

	function aiAct() {
		if (screen !== 'playing') return;
		if (Date.now() < aiCooldownUntil) {
			scheduleAiAction();
			return;
		}

		const harvestable = vines.filter((v) => isHarvestable(v));
		if (harvestable.length === 0) return;

		let target: Vine | null = null;

		const aiTargets = aiChain.lastValue !== null
			? getChainTargets(aiChain.lastValue)
			: new Set<number>();
		const chainVines = harvestable.filter((v) => aiTargets.has(v.value));
		const aiMult = getChainMultiplier(aiChain.length + 1);

		switch (difficulty) {
			case 'seedling': {
				if (Math.random() < 0.3) break;
				target = harvestable[Math.floor(Math.random() * harvestable.length)];
				break;
			}
			case 'gardener': {
				if (Math.random() < 0.15) break;
				if (chainVines.length > 0 && Math.random() < 0.6) {
					target = highest(chainVines);
				} else {
					target = highest(harvestable);
				}
				break;
			}
			case 'botanist': {
				if (Math.random() < 0.05) break;
				if (chainVines.length > 0) {
					const bestChain = highest(chainVines);
					const bestRaw = highest(harvestable);
					if (bestChain.value * aiMult > bestRaw.value) {
						target = bestChain;
					} else {
						target = Math.random() < 0.3 ? bestChain : bestRaw;
					}
				} else {
					target = highest(harvestable);
				}
				break;
			}
		}

		if (target) {
			doHarvest(target.id, AI);
		}

		if (screen === 'playing') {
			scheduleAiAction();
		}
	}

	function highest(arr: Vine[]): Vine {
		return arr.reduce((best, v) => v.value > best.value ? v : best);
	}

	function randomBetween(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function handleRematch() { startGame(difficulty); }
	function handleHome() { window.location.href = '/'; }
</script>

<svelte:head>
	<title>Solo Play - Gardener's Dilemma</title>
</svelte:head>

{#if screen === 'difficulty'}
	<main class="flex flex-col items-center justify-center min-h-svh px-6 py-6 sm:py-12">
		<div class="w-full max-w-md space-y-8 sm:space-y-10 text-center">
			<header class="space-y-2">
				<h1 class="font-display text-4xl font-semibold text-forest">Solo Play</h1>
				<p class="text-warmgray">Choose your difficulty</p>
			</header>

			<div class="space-y-3">
				{#each [
					{ id: 'seedling' as AiDifficulty, label: 'Seedling', desc: 'Slow reactions. A good place to learn.' },
					{ id: 'gardener' as AiDifficulty, label: 'Gardener', desc: 'Moderate speed. Knows when to wait.' },
					{ id: 'botanist' as AiDifficulty, label: 'Botanist', desc: 'Fast and strategic. Good luck.' },
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
	<main class="flex flex-col min-h-svh max-w-lg mx-auto">
		<div class="px-4 pt-4 space-y-3">
			<ScoreBar
				{scores}
				{timeLeft}
				playerSlot={PLAYER}
				chainMultiplier={playerMultiplier}
			/>

			<div class="h-1.5 bg-warmgray/20 rounded-full overflow-hidden">
				<div
					class="h-full bg-sage/60 rounded-full transition-none"
					style="width: {tickProgress * 100}%"
				></div>
			</div>
		</div>

		<div class="flex-1 flex items-end px-2 pb-4">
			<VineRow
				{vines}
				disabled={playerOnCooldown}
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
					text-center harvest-popup
					{lastHarvest.playerId === PLAYER ? 'text-terracotta' : 'text-indigo'}"
				role="status"
				aria-live="polite"
			>
				<div class="text-2xl font-display font-bold">+{lastHarvest.multiplied}</div>
				{#if lastHarvest.multiplied !== lastHarvest.value}
					<div class="text-sm font-mono opacity-70">{lastHarvest.value} x {(lastHarvest.multiplied / lastHarvest.value).toFixed(1)}</div>
				{/if}
			</div>
		{/if}
	</main>

{:else if screen === 'gameover' && winner !== null}
	<GameOver
		{winner}
		{scores}
		playerSlot={PLAYER}
		onrematch={handleRematch}
		onhome={handleHome}
	/>
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
