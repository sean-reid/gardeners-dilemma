<script lang="ts">
	import type { PlayerSlot } from '@gardeners-dilemma/game-logic';
	import { fade } from 'svelte/transition';

	let {
		winner,
		scores,
		playerSlot,
		onrematch,
		onhome,
	}: {
		winner: PlayerSlot | 'draw';
		scores: [number, number];
		playerSlot: PlayerSlot;
		onrematch: () => void;
		onhome: () => void;
	} = $props();

	let isWinner = $derived(winner === playerSlot);
	let isDraw = $derived(winner === 'draw');

	let headlineText = $derived(isDraw ? 'Draw.' : isWinner ? 'You win!' : 'You lose.');
	let headlineColor = $derived(
		isDraw ? 'text-warmgray' : isWinner ? 'text-terracotta' : 'text-indigo'
	);

	let yourScore = $derived(scores[playerSlot - 1]);
	let rivalScore = $derived(scores[playerSlot === 1 ? 1 : 0]);

	let dialogEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (dialogEl) {
			const btn = dialogEl.querySelector('button');
			btn?.focus();
		}
	});
</script>

<div
	bind:this={dialogEl}
	role="dialog"
	aria-modal="true"
	aria-label="{headlineText} Your score {yourScore}, rival score {rivalScore}"
	class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bark/70 px-6"
	transition:fade={{ duration: 300 }}
>
	<div class="flex flex-col items-center gap-6">
		<h1 class="text-5xl font-display font-bold {headlineColor}">
			{headlineText}
		</h1>

		<div class="flex items-center gap-8">
			<div class="flex flex-col items-center">
				<span class="text-xs font-body text-parchment/60 uppercase tracking-wide">You</span>
				<span class="text-4xl font-display font-bold text-parchment">{yourScore}</span>
			</div>
			<span class="text-2xl font-body text-parchment/40">-</span>
			<div class="flex flex-col items-center">
				<span class="text-xs font-body text-parchment/60 uppercase tracking-wide">Rival</span>
				<span class="text-4xl font-display font-bold text-parchment">{rivalScore}</span>
			</div>
		</div>

		<div class="flex flex-col items-center gap-3 mt-4 w-full max-w-xs">
			<button
				class="w-full py-4 rounded-xl bg-forest text-parchment text-lg font-semibold font-body
					shadow-md transition-all duration-200 hover:bg-forest/90 active:scale-95"
				onclick={onrematch}
				style="min-height: 48px;"
			>
				Play Again
			</button>

			<button
				class="text-parchment/60 font-body text-sm hover:text-parchment transition-colors underline underline-offset-2"
				onclick={onhome}
			>
				Home
			</button>
		</div>
	</div>
</div>
