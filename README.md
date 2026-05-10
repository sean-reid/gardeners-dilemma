# Gardener's Dilemma

A competitive strategy game where two players race to harvest vines at peak value. Each vine grows and shrinks according to the Collatz sequence, making it impossible to predict long-term behavior. Simple rules, deep strategy, no skill ceiling.

## How to Play

- 7 shared vines on the board, each with a visible number
- Each turn, both players simultaneously choose: **Cut** one vine, or **Wait**
- If only one player cuts a vine, they score its value
- If both cut the same vine, it's destroyed and nobody scores
- After each turn, surviving vines step through a Collatz iteration (even: halve, odd: triple and add one)
- Vines that reach 1 wither away, and a new vine sprouts in its place
- First to 200 points wins, or highest score after 15 turns

## Modes

- **Solo Play** - Three AI difficulty tiers: Seedling, Gardener, Botanist
- **Online Multiplayer** - Create a room, share the code, play in real time

## Tech Stack

- **Frontend**: SvelteKit 2 + Tailwind CSS 4, deployed to Cloudflare Pages
- **Multiplayer**: PartyKit (WebSocket rooms on Cloudflare edge)
- **Shared logic**: `@gardeners-dilemma/game-logic` internal package
- **Monorepo**: pnpm workspaces + Turborepo

## Development

```bash
pnpm install
pnpm dev
```

The web app runs on `http://localhost:5173` and the PartyKit server on `http://localhost:1999`.

## Project Structure

```
apps/
  web/          SvelteKit frontend
  party/        PartyKit multiplayer server
packages/
  game-logic/   Shared game engine, types, Collatz math
```

## License

MIT
