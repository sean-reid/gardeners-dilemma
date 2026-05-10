# Gardener's Dilemma

A real-time competitive strategy game where two players race to harvest vines at peak value. Vines grow and shrink according to the Collatz sequence, making long-term prediction impossible. Simple rules, deep strategy, no skill ceiling.

**Play now at [gardeners-dilemma.pages.dev](https://gardeners-dilemma.pages.dev)**

## How to Play

- 5 vines on the board, each ticking through the Collatz sequence every 2.5 seconds
- Even numbers halve, odd numbers triple and add one
- Only **odd-valued** (ripe) vines can be harvested - tap one to score its value
- After harvesting, you're on a 3-second cooldown before you can harvest again
- A new vine sprouts immediately to replace any harvested or withered vine
- First to 500 points wins, or highest score after 90 seconds

The strategy: vines start small but can spike to huge values through Collatz growth. Do you grab a 17 now, or wait for it to become 52 next tick (even, locked), then 26, then 13, then 40, then 20, then 10, then 5? Timing your harvests around the cooldown and predicting when values will peak at an odd number is the whole game.

## Modes

- **Solo Play** - Three AI difficulty tiers: Seedling, Gardener, Botanist
- **Online Multiplayer** - Create a room, share the code, play against a friend in real time

## Tech Stack

- **Frontend**: SvelteKit 2 + Tailwind CSS 4, deployed to Cloudflare Pages
- **Multiplayer**: PartyKit (WebSocket server on Cloudflare Workers)
- **Shared logic**: `@gardeners-dilemma/game-logic` internal package
- **Monorepo**: pnpm workspaces + Turborepo
- **CI/CD**: GitHub Actions, auto-deploy on push to main

## Development

```bash
pnpm install

# Start both the web app and multiplayer server
pnpm dev --filter=@gardeners-dilemma/web
cd apps/party && npx partykit dev
```

The web app runs on `localhost:5173` and connects to the PartyKit dev server on `localhost:1999`.

## License

MIT
