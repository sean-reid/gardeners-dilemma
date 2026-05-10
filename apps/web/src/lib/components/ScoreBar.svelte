<script lang="ts">
	import type { PlayerSlot } from '@gardeners-dilemma/game-logic';

	let {
		scores,
		turn,
		maxTurns,
		playerSlot,
	}: {
		scores: [number, number];
		turn: number;
		maxTurns: number;
		playerSlot: PlayerSlot;
	} = $props();

	let yourScore = $derived(scores[playerSlot - 1]);
	let rivalScore = $derived(scores[playerSlot === 1 ? 1 : 0]);
	let yourColor = $derived(playerSlot === 1 ? 'text-terracotta' : 'text-indigo');
	let rivalColor = $derived(playerSlot === 1 ? 'text-indigo' : 'text-terracotta');

	let prevYourScore = $state(0);
	let prevRivalScore = $state(0);
	let yourBump = $state(false);
	let rivalBump = $state(false);

	$effect(() => {
		const current = yourScore;
		if (current !== prevYourScore) {
			if (prevYourScore !== 0 || current !== 0) yourBump = true;
			prevYourScore = current;
			setTimeout(() => (yourBump = false), 400);
		}
	});

	$effect(() => {
		const current = rivalScore;
		if (current !== prevRivalScore) {
			if (prevRivalScore !== 0 || current !== 0) rivalBump = true;
			prevRivalScore = current;
			setTimeout(() => (rivalBump = false), 400);
		}
	});
</script>

<div class="flex items-center justify-between px-4 py-3 bg-bark/5 rounded-xl">
	<div class="flex flex-col items-start">
		<span class="text-xs font-body text-warmgray uppercase tracking-wide">You</span>
		<span
			class="text-2xl font-display font-bold transition-transform duration-300 {yourColor}
				{yourBump ? 'scale-125' : 'scale-100'}"
		>
			{yourScore}
		</span>
	</div>

	<div class="flex flex-col items-center">
		<span class="font-mono text-xs text-bark/40">
			Turn {turn}/{maxTurns}
		</span>
		<span class="font-mono text-sm text-bark/60">
			First to 200
		</span>
	</div>

	<div class="flex flex-col items-end">
		<span class="text-xs font-body text-warmgray uppercase tracking-wide">Rival</span>
		<span
			class="text-2xl font-display font-bold transition-transform duration-300 {rivalColor}
				{rivalBump ? 'scale-125' : 'scale-100'}"
		>
			{rivalScore}
		</span>
	</div>
</div>
