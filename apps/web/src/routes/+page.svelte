<script lang="ts">
	let joinCode = $state('');

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

<main class="flex flex-col items-center justify-center min-h-screen px-6 py-12">
	<div class="w-full max-w-md space-y-12 text-center">
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
				<div class="flex gap-3">
					<input
						id="join-code"
						type="text"
						maxlength={4}
						placeholder="ABCD"
						bind:value={joinCode}
						class="flex-1 rounded-xl border-2 border-warmgray/30 bg-parchment px-4 py-3
							text-center text-2xl font-mono uppercase tracking-[0.3em] text-bark
							placeholder:text-warmgray/40
							focus:border-indigo focus:outline-none transition-colors"
						onkeydown={(e) => { if (e.key === 'Enter') handleJoin(); }}
					/>
					<button
						onclick={handleJoin}
						disabled={joinCode.length !== 4}
						class="rounded-xl bg-terracotta px-6 py-3 font-semibold text-parchment
							transition-colors hover:bg-terracotta/90 active:bg-terracotta/80
							disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
					>
						Join
					</button>
				</div>
			</div>
		</section>

		<!-- Footer hint -->
		<p class="text-sm text-warmgray/60">
			A game of Collatz sequences, pruning, and nerve.
		</p>
	</div>
</main>
