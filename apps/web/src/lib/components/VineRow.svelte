<script lang="ts">
	import type { Vine as VineType, PlayerSlot } from '@gardeners-dilemma/game-logic';
	import Vine from './Vine.svelte';

	let {
		vines,
		disabled = false,
		playerSlot,
		onharvest,
	}: {
		vines: VineType[];
		disabled?: boolean;
		playerSlot: PlayerSlot;
		onharvest?: (vineId: number) => void;
	} = $props();

	function isRipe(vine: VineType): boolean {
		return vine.alive && vine.value % 2 !== 0;
	}
</script>

<div class="w-full px-3">
	<div class="flex items-end justify-center gap-3 w-full" style="height: 380px;">
		{#each vines as vine (vine.id)}
			<Vine
				{vine}
				selected={false}
				disabled={disabled || !isRipe(vine)}
				onclick={() => onharvest?.(vine.id)}
			/>
		{/each}
	</div>

	<div class="flex justify-center gap-3 mt-2 mb-1">
		{#each vines as vine (vine.id)}
			<div
				class="flex-1 min-w-[56px] text-center transition-all duration-300"
			>
				<span
					class="inline-flex items-center justify-center w-full font-mono text-lg font-bold
						py-1.5 rounded-lg transition-all duration-200
						{isRipe(vine) && !disabled
							? 'text-forest'
							: 'text-warmgray/40'}"
				>
					{vine.value}
				</span>
				{#if vine.alive}
					<span class="block text-[10px] font-body mt-0.5 {isRipe(vine) ? 'text-forest/50' : 'text-warmgray/30'}">
						{isRipe(vine) ? 'ripe' : 'growing'}
					</span>
				{/if}
			</div>
		{/each}
	</div>
</div>
