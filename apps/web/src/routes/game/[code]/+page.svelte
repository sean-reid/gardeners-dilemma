<script lang="ts">
	import { page } from '$app/state';

	const code = $derived(page.params.code.toUpperCase());
</script>

<svelte:head>
	<title>Game {code} - Gardener's Dilemma</title>
</svelte:head>

<main class="flex flex-col items-center justify-center min-h-screen px-6 py-12">
	<div class="w-full max-w-md space-y-10 text-center">
		<header class="space-y-2">
			<h1 class="font-display text-4xl font-semibold text-forest">Online Play</h1>
			<p class="text-warmgray">Coming soon. Try Solo Play for now.</p>
		</header>

		<div class="rounded-2xl border-2 border-warmgray/20 bg-white/50 px-8 py-6">
			<p class="text-sm font-mono text-warmgray uppercase tracking-wide mb-2">Room Code</p>
			<p class="text-5xl font-mono font-semibold text-indigo tracking-[0.3em]">{code}</p>
		</div>

		<a href="/" class="inline-block text-sm text-warmgray hover:text-bark transition-colors">
			&#8592; Back
		</a>
	</div>
</main>
