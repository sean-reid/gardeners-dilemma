<script lang="ts">
	import type { Vine as VineType, TurnResult, PlayerSlot } from '@gardeners-dilemma/game-logic';
	import Vine from './Vine.svelte';

	let {
		vines,
		selectedVineId = null,
		disabled = false,
		turnResult = null,
		playerSlot,
		onselect,
	}: {
		vines: VineType[];
		selectedVineId?: number | null;
		disabled?: boolean;
		turnResult?: TurnResult | null;
		playerSlot: PlayerSlot;
		onselect?: (vineId: number) => void;
	} = $props();

	function getCutBy(vineId: number): PlayerSlot | null {
		if (!turnResult) return null;
		const cut = turnResult.cuts.find((c) => c.vineId === vineId);
		return cut ? cut.playerId : null;
	}

	function isClashed(vineId: number): boolean {
		if (!turnResult) return false;
		return turnResult.clashes.includes(vineId);
	}
</script>

<div class="w-full px-3">
	<!-- Vine stems -->
	<div class="flex items-end justify-center gap-1.5 w-full" style="height: 380px;">
		{#each vines as vine (vine.id)}
			<Vine
				{vine}
				selected={selectedVineId === vine.id}
				{disabled}
				cutBy={getCutBy(vine.id)}
				clashed={isClashed(vine.id)}
				onclick={() => onselect?.(vine.id)}
			/>
		{/each}
	</div>

	<!-- Ground-level value labels -->
	<div class="flex justify-center gap-1.5 mt-2 mb-1">
		{#each vines as vine (vine.id)}
			<div
				class="flex-1 min-w-[44px] text-center transition-all duration-300"
				style="opacity: {vine.alive ? 1 : 0.2};"
			>
				<span
					class="inline-flex items-center justify-center w-full font-mono text-base font-bold
						py-1 rounded-lg transition-all duration-200
						{selectedVineId === vine.id
							? 'bg-terracotta/15 text-terracotta scale-110'
							: vine.value % 2 === 0
								? 'text-sage'
								: 'text-forest'}"
				>
					{vine.value}
				</span>
			</div>
		{/each}
	</div>
</div>
