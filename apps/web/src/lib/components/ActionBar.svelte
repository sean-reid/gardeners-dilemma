<script lang="ts">
	let {
		selectedVineId = null,
		selectedVineValue = null,
		locked = false,
		disabled = false,
		oncut,
		onwait,
	}: {
		selectedVineId?: number | null;
		selectedVineValue?: number | null;
		locked?: boolean;
		disabled?: boolean;
		oncut?: (vineId: number) => void;
		onwait?: () => void;
	} = $props();

	let cutDisabled = $derived(disabled || locked || selectedVineId === null);
	let waitDisabled = $derived(disabled || locked);

	function handleCut() {
		if (selectedVineId !== null) {
			oncut?.(selectedVineId);
		}
	}
</script>

<div class="flex gap-3 px-4 pb-4">
	{#if locked}
		<div class="flex-1 flex items-center justify-center py-4 rounded-xl bg-warmgray/40 text-bark/50 font-body text-lg">
			Locked in
		</div>
	{:else}
		<button
			class="flex-1 py-4 rounded-xl text-lg font-semibold font-body
				transition-all duration-200 active:scale-95
				{cutDisabled
					? 'bg-warmgray/30 text-bark/30 cursor-not-allowed'
					: 'bg-terracotta text-parchment shadow-md hover:bg-terracotta/90'}"
			disabled={cutDisabled}
			onclick={handleCut}
			style="min-height: 48px;"
		>
			{selectedVineValue !== null ? `Cut (${selectedVineValue})` : 'Cut'}
		</button>

		<button
			class="flex-1 py-4 rounded-xl text-lg font-semibold font-body
				transition-all duration-200 active:scale-95
				{waitDisabled
					? 'bg-warmgray/30 text-bark/30 cursor-not-allowed'
					: 'bg-warmgray text-bark shadow-md hover:bg-warmgray/80'}"
			disabled={waitDisabled}
			onclick={() => onwait?.()}
			style="min-height: 48px;"
		>
			Wait
		</button>
	{/if}
</div>
