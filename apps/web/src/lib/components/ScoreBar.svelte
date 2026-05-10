<script lang="ts">
	import type { PlayerSlot } from '@gardeners-dilemma/game-logic';

	let {
		scores,
		timeLeft,
		playerSlot,
	}: {
		scores: [number, number];
		timeLeft: number;
		playerSlot: PlayerSlot;
	} = $props();

	let yourScore = $derived(scores[playerSlot - 1]);
	let rivalScore = $derived(scores[playerSlot === 1 ? 1 : 0]);

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

	let minutes = $derived(Math.floor(timeLeft / 60));
	let seconds = $derived(timeLeft % 60);
	let timeDisplay = $derived(`${minutes}:${seconds.toString().padStart(2, '0')}`);
	let timeUrgent = $derived(timeLeft <= 15);
</script>

<div class="sr-only" aria-live="polite" aria-atomic="true">
	You: {yourScore}. Rival: {rivalScore}. Time: {timeDisplay}.
</div>
<div class="flex items-center justify-between px-4 py-3 bg-bark/5 rounded-xl" aria-hidden="true">
	<div class="flex flex-col items-start">
		<span class="text-xs font-body text-warmgray uppercase tracking-wide">You</span>
		<span
			class="text-2xl font-display font-bold transition-transform duration-300 text-terracotta
				{yourBump ? 'scale-125' : 'scale-100'}"
		>
			{yourScore}
		</span>
	</div>

	<div class="flex flex-col items-center">
		<span class="font-mono text-xl font-semibold {timeUrgent ? 'text-burgundy' : 'text-bark/60'}">
			{timeDisplay}
		</span>
		<span class="font-mono text-xs text-bark/40">
			First to 500
		</span>
	</div>

	<div class="flex flex-col items-end">
		<span class="text-xs font-body text-warmgray uppercase tracking-wide">Rival</span>
		<span
			class="text-2xl font-display font-bold transition-transform duration-300 text-indigo
				{rivalBump ? 'scale-125' : 'scale-100'}"
		>
			{rivalScore}
		</span>
	</div>
</div>
