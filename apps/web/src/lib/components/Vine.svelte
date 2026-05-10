<script lang="ts">
	import type { Vine, PlayerSlot } from '@gardeners-dilemma/game-logic';

	let {
		vine,
		selected = false,
		disabled = false,
		cutBy = null,
		clashed = false,
		onclick,
	}: {
		vine: Vine;
		selected?: boolean;
		disabled?: boolean;
		cutBy?: PlayerSlot | null;
		clashed?: boolean;
		onclick?: () => void;
	} = $props();

	let heightPercent = $derived(Math.min(vine.value / 120, 1) * 100);
	let isEven = $derived(vine.value % 2 === 0);

	// Colors shift based on state
	let mainGreen = $derived(cutBy === 1 ? '#C85A3A' : cutBy === 2 ? '#3D4785' : '#3a6b45');
	let lightGreen = $derived(cutBy === 1 ? '#d4795f' : cutBy === 2 ? '#5a6aa0' : '#6aaa5c');
	let darkGreen = $derived(cutBy === 1 ? '#a04428' : cutBy === 2 ? '#2d3566' : '#2D5A3D');
	let leafFill1 = $derived(cutBy ? mainGreen : '#4a8a3e');
	let leafFill2 = $derived(cutBy ? lightGreen : '#6aaa5c');
	let leafFill3 = $derived(cutBy ? darkGreen : '#3a7a35');

	// Dynamic leaf count based on value - more leaves = more growth
	let leafCount = $derived(Math.max(1, Math.min(8, Math.floor(vine.value / 12))));

	// Stem thickness - thicker for higher values
	let stemWidth = $derived(3 + Math.min(vine.value / 30, 3));

	// Deterministic variation from vine ID
	let seed = $derived(vine.id * 7 + 3);

	// Generate leaf positions dynamically along the stem
	let leaves = $derived(
		Array.from({ length: leafCount }, (_, i) => {
			const t = (i + 1) / (leafCount + 1);
			const y = 290 - t * 265;
			const side = ((seed + i) % 2 === 0) ? 1 : -1;
			const angle = (20 + ((seed + i * 13) % 15)) * side;
			const size = 0.6 + ((seed + i * 7) % 4) * 0.1;
			// Leaves get smaller toward the top (younger growth)
			const ageFactor = 1 - t * 0.35;
			const fills = [leafFill1, leafFill2, leafFill3];
			return { y, side, angle, size: size * ageFactor, fill: fills[i % 3] };
		})
	);

	// Has tendril if value > 30
	let hasTendril = $derived(vine.value > 30);
	// Has flower bud if value > 60
	let hasFlower = $derived(vine.value > 60);

	// Stem curve control points - slight S-curve
	let stemPath = $derived(() => {
		const wobble = (seed % 3) * 2 - 2;
		return `M 30,295 C ${28 + wobble},265 ${33 - wobble},240 ${29 + wobble},210 C ${25 - wobble},180 ${34 + wobble},155 ${31 - wobble},130 C ${28 + wobble},105 ${33 - wobble},75 ${30 + wobble},45 C ${29 - wobble},25 ${31 + wobble},10 30,5`;
	});

	function handleClick() {
		if (!disabled && vine.alive && onclick) onclick();
	}
</script>

<button
	class="vine-wrap group relative
		transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
		{vine.alive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
		{clashed ? 'vine-clash' : ''}
		{disabled && vine.alive ? 'pointer-events-none' : ''}"
	style="height: {vine.alive ? heightPercent : 0}%;
		min-height: {vine.alive ? '4.5rem' : '0'};
		opacity: {vine.alive ? 1 : 0};
		flex: 1; min-width: 44px; transform-origin: bottom;"
	onclick={handleClick}
	disabled={disabled || !vine.alive}
	aria-label="Vine {vine.id + 1}, value {vine.value}"
>
	<!-- Selection glow -->
	{#if selected}
		<div class="absolute -inset-1.5 rounded-2xl vine-pulse-ring z-0"></div>
	{/if}

	<svg
		class="absolute inset-0 w-full h-full overflow-visible"
		viewBox="0 0 60 300"
		preserveAspectRatio="xMidYMax meet"
	>
		<defs>
			<linearGradient id="stem-g-{vine.id}" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={lightGreen} />
				<stop offset="50%" stop-color={mainGreen} />
				<stop offset="100%" stop-color={darkGreen} />
			</linearGradient>
		</defs>

		<!-- Soil at base -->
		<ellipse cx="30" cy="298" rx="20" ry="5" fill="#8B7355" opacity="0.25" />
		<ellipse cx="30" cy="297" rx="15" ry="3" fill="#6B5B45" opacity="0.15" />

		<!-- Main stem -->
		<path
			d={stemPath()}
			fill="none"
			stroke="url(#stem-g-{vine.id})"
			stroke-width={stemWidth}
			stroke-linecap="round"
			class="transition-all duration-500"
		/>
		<!-- Stem highlight -->
		<path
			d={stemPath()}
			fill="none"
			stroke={lightGreen}
			stroke-width="1.2"
			stroke-linecap="round"
			opacity="0.2"
		/>

		<!-- Dynamic leaves -->
		{#each leaves as leaf, i (i)}
			<g transform="translate(30, {leaf.y}) scale({leaf.side * leaf.size}, {leaf.size})">
				<!-- Main leaf body -->
				<path
					d="M 0,0 C 7,-7 20,-11 28,-5 C 20,-1 7,3 0,0 Z"
					fill={leaf.fill}
					opacity={0.75 + (i % 3) * 0.08}
					class="transition-all duration-500"
				/>
				<!-- Center vein -->
				<path
					d="M 1,-0.5 C 8,-4 16,-6 24,-3.5"
					fill="none"
					stroke={darkGreen}
					stroke-width="0.5"
					opacity="0.35"
				/>
				<!-- Side veins -->
				<path d="M 8,-3.5 L 10,-7" fill="none" stroke={darkGreen} stroke-width="0.3" opacity="0.2" />
				<path d="M 14,-4.5 L 16,-8" fill="none" stroke={darkGreen} stroke-width="0.3" opacity="0.2" />
			</g>
		{/each}

		<!-- Curling tendrils (only on taller vines) -->
		{#if hasTendril}
			<path
				d="M 30,{80 - (seed % 20)} C {26 - seed % 3},{72 - (seed % 20)} {34 + seed % 3},{66 - (seed % 20)} {37 + seed % 2},{70 - (seed % 20)} C {40 + seed % 2},{74 - (seed % 20)} {35 - seed % 2},{76 - (seed % 20)} {32 + seed % 2},{73 - (seed % 20)}"
				fill="none"
				stroke={mainGreen}
				stroke-width="1.1"
				stroke-linecap="round"
				opacity="0.4"
			/>
		{/if}

		<!-- Flower bud on tall/valuable vines -->
		{#if hasFlower}
			<g transform="translate(30, 20)">
				<!-- Sepals -->
				<ellipse cx="-3" cy="2" rx="3" ry="5" fill={leafFill3} opacity="0.5" transform="rotate(-15, -3, 2)" />
				<ellipse cx="3" cy="2" rx="3" ry="5" fill={leafFill3} opacity="0.5" transform="rotate(15, 3, 2)" />
				<!-- Bud petals -->
				<ellipse cx="0" cy="0" rx="3.5" ry="6" fill={isEven ? '#e8c84a' : '#d4a044'} opacity="0.6" transform="rotate(-5)" />
				<ellipse cx="1.5" cy="-0.5" rx="3" ry="5" fill={isEven ? '#f0d860' : '#e0b050'} opacity="0.5" transform="rotate(8)" />
			</g>
		{:else}
			<!-- Simple growing tip for smaller vines -->
			<g transform="translate(30, 15)">
				<ellipse cx="0" cy="0" rx="2" ry="4" fill={leafFill1} opacity="0.5" transform="rotate(-8)" />
				<ellipse cx="1" cy="0" rx="1.5" ry="3" fill={leafFill2} opacity="0.4" transform="rotate(8)" />
			</g>
		{/if}

		<!-- Root tendrils -->
		<path d="M 30,296 C 24,302 18,306 15,308" fill="none" stroke="#6B5B45" stroke-width="1.5" opacity="0.2" stroke-linecap="round" />
		<path d="M 30,296 C 36,303 42,306 45,307" fill="none" stroke="#6B5B45" stroke-width="1.5" opacity="0.2" stroke-linecap="round" />
		<path d="M 30,297 C 29,304 28,310 29,314" fill="none" stroke="#6B5B45" stroke-width="1" opacity="0.15" stroke-linecap="round" />

		<!-- Cut slash -->
		{#if cutBy !== null}
			<line x1="5" y1="155" x2="55" y2="142" stroke="var(--color-parchment)" stroke-width="3.5" stroke-linecap="round" opacity="0.8" />
			<line x1="5" y1="155" x2="55" y2="142" stroke={cutBy === 1 ? '#C85A3A' : '#3D4785'} stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
		{/if}
	</svg>

</button>

<style>
	.vine-pulse-ring {
		border: 2px solid rgba(200, 90, 58, 0.5);
		background: rgba(200, 90, 58, 0.04);
		animation: pulse-glow 1.8s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%, 100% { box-shadow: 0 0 0 0 rgba(200, 90, 58, 0.25); border-color: rgba(200, 90, 58, 0.5); }
		50% { box-shadow: 0 0 16px 4px rgba(200, 90, 58, 0.1); border-color: rgba(200, 90, 58, 0.3); }
	}

	.vine-clash {
		animation: clash-shake 0.6s ease-in-out;
	}

	@keyframes clash-shake {
		0%, 100% { transform: translateX(0) rotate(0deg); }
		15% { transform: translateX(-4px) rotate(-3deg); }
		30% { transform: translateX(4px) rotate(3deg); }
		45% { transform: translateX(-3px) rotate(-2deg); }
		60% { transform: translateX(3px) rotate(2deg); }
		75% { transform: translateX(-1px) rotate(-0.5deg); }
	}
</style>
