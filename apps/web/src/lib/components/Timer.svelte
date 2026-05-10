<script lang="ts">
	let {
		seconds,
		running,
		maxSeconds,
		onexpire,
	}: {
		seconds: number;
		running: boolean;
		maxSeconds: number;
		onexpire?: () => void;
	} = $props();

	let remaining = $state(0);

	$effect(() => {
		remaining = seconds;
	});

	$effect(() => {
		if (!running) return;

		const id = setInterval(() => {
			remaining -= 1;
			if (remaining <= 0) {
				remaining = 0;
				clearInterval(id);
				onexpire?.();
			}
		}, 1000);

		return () => clearInterval(id);
	});

	let fraction = $derived(maxSeconds > 0 ? remaining / maxSeconds : 0);

	let barColor = $derived(
		remaining <= 3 ? 'bg-burgundy' : remaining <= 5 ? 'bg-terracotta' : 'bg-sage'
	);

	let textColor = $derived(
		remaining <= 3 ? 'text-burgundy' : remaining <= 5 ? 'text-terracotta' : 'text-bark/70'
	);
</script>

<div class="relative w-full h-8 bg-bark/10 rounded-lg overflow-hidden">
	<div
		class="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-linear {barColor}"
		style="width: {fraction * 100}%;"
	></div>
	<div class="absolute inset-0 flex items-center justify-center">
		<span class="font-mono text-sm font-semibold {textColor}">
			{remaining}s
		</span>
	</div>
</div>
