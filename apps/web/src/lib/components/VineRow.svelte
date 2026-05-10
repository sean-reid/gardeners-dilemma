<script lang="ts">
	import type { Vine as VineType, PlayerSlot } from '@gardeners-dilemma/game-logic';
	import Vine from './Vine.svelte';

	let {
		vines,
		disabled = false,
		chainTargets = new Set<number>(),
		chainLength = 0,
		playerSlot,
		onharvest,
	}: {
		vines: VineType[];
		disabled?: boolean;
		chainTargets?: Set<number>;
		chainLength?: number;
		playerSlot: PlayerSlot;
		onharvest?: (vineId: number) => void;
	} = $props();
</script>

<div class="w-full px-3">
	<div class="flex items-end justify-center gap-3 w-full" style="height: 380px;">
		{#each vines as vine (vine.id)}
			<Vine
				{vine}
				selected={false}
				chained={chainTargets.has(vine.value)}
				{disabled}
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
						{chainTargets.has(vine.value)
							? 'text-amber-700'
							: disabled ? 'text-warmgray/40' : 'text-forest'}"
				>
					{vine.value}
				</span>
			</div>
		{/each}
	</div>
</div>
