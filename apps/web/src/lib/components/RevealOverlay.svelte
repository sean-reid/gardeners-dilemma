<script lang="ts">
	import type { TurnResult, PlayerSlot } from '@gardeners-dilemma/game-logic';
	import { fly, fade } from 'svelte/transition';

	let {
		result,
		playerSlot,
		ondismiss,
	}: {
		result: TurnResult;
		playerSlot: PlayerSlot;
		ondismiss: () => void;
	} = $props();

	let yourAction = $derived(playerSlot === 1 ? result.player1Action : result.player2Action);
	let rivalAction = $derived(playerSlot === 1 ? result.player2Action : result.player1Action);

	function describeYourAction(): string {
		if (yourAction.type === 'wait') return 'You waited';
		const bothCutSame = result.clashes.includes(yourAction.vineId);
		const cut = result.cuts.find(
			(c) => c.vineId === yourAction.vineId && c.playerId === playerSlot
		);
		if (bothCutSame) return 'You both reached for the same vine!';
		return cut ? `You harvested a vine (+${cut.value})` : 'You cut a vine';
	}

	function describeRivalAction(): string {
		if (rivalAction.type === 'wait') return 'Rival waited';
		const rivalSlot: PlayerSlot = playerSlot === 1 ? 2 : 1;
		const bothCutSame = result.clashes.includes(rivalAction.vineId);
		const cut = result.cuts.find(
			(c) => c.vineId === rivalAction.vineId && c.playerId === rivalSlot
		);
		if (bothCutSame) return '';
		return cut ? `Rival harvested a vine (+${cut.value})` : 'Rival cut a vine';
	}

	$effect(() => {
		const timer = setTimeout(() => ondismiss(), 3000);
		return () => clearTimeout(timer);
	});
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-bark/60"
	transition:fade={{ duration: 200 }}
>
	<div
		class="mx-4 w-full max-w-sm rounded-2xl bg-parchment p-6 shadow-2xl space-y-4"
		transition:fly={{ y: 40, duration: 300 }}
	>
		<p class="text-lg font-display font-semibold text-bark">
			{describeYourAction()}
		</p>

		<p class="text-lg font-display text-bark/70">
			{describeRivalAction()}
		</p>

		{#if result.clashes.length > 0}
			<p class="text-base font-body font-bold text-burgundy">
				Both cut the same vine - it's ruined. Nobody scores.
			</p>
		{/if}

		{#if result.sprouted.length > 0}
			<p class="text-base font-body text-sage">
				A new vine sprouts from the soil...
			</p>
		{/if}

		<button
			class="w-full pt-2 text-sm text-warmgray font-body hover:text-bark transition-colors"
			onclick={ondismiss}
		>
			Tap to continue
		</button>
	</div>
</div>
