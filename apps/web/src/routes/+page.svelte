<script lang="ts">
	let joinCode = $state('');
	let showHowTo = $state(false);

	function handleJoin() {
		if (joinCode.length === 4) {
			window.location.href = `/game/${joinCode.toUpperCase()}`;
		}
	}

	function handleCreate() {
		// Generate a random 4-char code for now
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
		let code = '';
		for (let i = 0; i < 4; i++) {
			code += chars[Math.floor(Math.random() * chars.length)];
		}
		window.location.href = `/game/${code}`;
	}
</script>

<svelte:head>
	<title>Gardener's Dilemma</title>
</svelte:head>

<main class="flex flex-col items-center justify-center min-h-svh px-6 py-6 sm:py-12">
	<div class="w-full max-w-md space-y-8 sm:space-y-12 text-center">
		<!-- Title -->
		<header class="space-y-3">
			<h1 class="font-display text-5xl sm:text-6xl font-semibold text-forest leading-tight">
				Gardener's Dilemma
			</h1>
			<p class="text-lg text-warmgray font-body">
				Tend your vines. Time your harvest.
			</p>
		</header>

		<!-- Solo Play -->
		<section class="space-y-3">
			<a
				href="/solo"
				class="block w-full rounded-xl bg-forest px-6 py-4 text-center text-lg font-semibold text-parchment
					transition-colors hover:bg-forest/90 active:bg-forest/80"
			>
				Solo Play
			</a>
		</section>

		<!-- Multiplayer -->
		<section class="space-y-6">
			<div class="flex items-center gap-4">
				<hr class="flex-1 border-warmgray/40" />
				<span class="text-sm text-warmgray uppercase tracking-wide font-mono">or play online</span>
				<hr class="flex-1 border-warmgray/40" />
			</div>

			<button
				onclick={handleCreate}
				class="block w-full rounded-xl bg-indigo px-6 py-4 text-center text-lg font-semibold text-parchment
					transition-colors hover:bg-indigo/90 active:bg-indigo/80 cursor-pointer"
			>
				Create Game
			</button>

			<div class="space-y-3">
				<label for="join-code" class="block text-sm font-mono text-warmgray uppercase tracking-wide">
					Join with code
				</label>
				<div class="flex gap-2 sm:gap-3">
					<input
						id="join-code"
						type="text"
						maxlength={4}
						placeholder="ABCD"
						bind:value={joinCode}
						class="flex-1 min-w-0 rounded-xl border-2 border-warmgray/30 bg-parchment px-3 sm:px-4 py-3
							text-center text-2xl font-mono uppercase tracking-[0.15em] sm:tracking-[0.3em] text-bark
							placeholder:text-warmgray/40
							focus:border-indigo focus:outline-none transition-colors"
						onkeydown={(e) => { if (e.key === 'Enter') handleJoin(); }}
					/>
					<button
						onclick={handleJoin}
						disabled={joinCode.length !== 4}
						class="shrink-0 rounded-xl bg-terracotta px-4 sm:px-6 py-3 font-semibold text-parchment
							transition-colors hover:bg-terracotta/90 active:bg-terracotta/80
							disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
					>
						Join
					</button>
				</div>
			</div>
		</section>

		<!-- How to play -->
		<section class="text-left">
			<button
				onclick={() => showHowTo = !showHowTo}
				class="w-full text-sm text-warmgray/60 hover:text-warmgray transition-colors cursor-pointer text-center"
			>
				{showHowTo ? 'Hide' : 'How to play'}
			</button>

			{#if showHowTo}
				<div class="mt-4 space-y-4 text-sm text-bark/70 leading-relaxed">
					<div>
						<h3 class="font-display font-semibold text-bark mb-1">The Garden</h3>
						<p>Five vines grow on the board. Every 2.5 seconds, each vine changes value following the Collatz rule: even numbers halve, odd numbers triple and add one. Tap any vine to harvest it and score its value. After harvesting, you wait 3 seconds before you can harvest again.</p>
					</div>

					<div>
						<h3 class="font-display font-semibold text-bark mb-1">Chains</h3>
						<p>This is where it gets deep. If your next harvest is a number that appears in the Collatz sequence of your previous harvest, you build a chain. Chains multiply your score: 1.5x, 2x, 2.5x, and so on. Harvest something outside the sequence and the chain breaks.</p>
					</div>

					<div>
						<h3 class="font-display font-semibold text-bark mb-1">Example</h3>
						<p>You harvest a <span class="font-mono font-bold">13</span>. Its Collatz sequence is 40, 20, 10, 5, 16, 8... If a vine on the board shows <span class="font-mono font-bold">40</span>, grabbing it continues your chain at 1.5x. Golden outlines show which vines keep your chain alive.</p>
					</div>

					<div>
						<h3 class="font-display font-semibold text-bark mb-1">Winning</h3>
						<p>First to 500 points, or highest score after 90 seconds. Play it safe with raw harvests, or gamble on building long chains for massive multiplied scores.</p>
					</div>
				</div>
			{/if}
		</section>
	</div>
</main>
