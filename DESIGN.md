# DIH Game Design & Architecture

This document describes the architecture and deep progression design for a 3D web-based incremental/clicker game inspired by Evolve Idle. It outlines the responsibilities for each technology (React + Three.js, Vue3 admin, Python REST, C# game engine components), the five deep progression layers, long-term balance goals (target ~2 years of engagement), and deployment options (GitHub Pages, Netlify, Vercel, CI with GitHub Actions).

## High-level architecture

- Frontend (Player): `frontend/` — React + Vite + Three.js (WebGL). Primary game client, renders 3D, handles input, local save, and communicates with backend for persistence and multiplayer features.
- Admin Dashboard: `admin/` — Vue3 + Vite. Tools for content tuning, live events, analytics, and player management.
- Backend: `backend/` — Python (FastAPI). REST API for persistence, leaderboards, auth (optional), scheduled simulations, and analytics ingestion.
- Game Engine / Simulation: `unity/` — C# (Unity project placeholder). Heavy deterministic simulation components and complex physics/AI may live here; for web build we use WebGL export or run server-side simulations in C# if desired.

Notes on responsibilities:
- Use C# (Unity) for any complex simulation that benefits from a game engine (deterministic evolution systems, complex AI). For a pure web deployment, the Unity WebGL build can be embedded or the simulation can be ported to a lightweight deterministic C# server if needed.
- Python FastAPI backend provides a secure REST surface for saves, leaderboards, and serving admin data. It can be deployed to any cloud (Heroku, Fly, AWS, etc.) while frontends deploy to static hosts.

## Five Deep Progression Layers

Design goals: each layer composes with others; clear short-term feedback, mid-term goals, and long-term meta-progression. Layers should allow emergent strategies and long-term play with diminishing returns tuned for ~2 years casual progression.

1) Click/Active Layer (Layer 1)
  - Immediate interaction: clicking/tapping spawns resources, creatures, or evolution points.
  - Combos, critical clicks, timed skills, and multi-click abilities create depth.
  - Upgrades that improve click output: multipliers, click chains, auto-clickers.

2) Autonomous Production Layer (Layer 2)
  - Passive producers: creatures, habitats, factories that generate base resources.
  - Management: assign creatures to roles, limited slots, synergies between types.
  - Depth via nested producers (producer upgrades unlock sub-producers).

3) Evolution / Skill Tree Layer (Layer 3)
  - Non-linear evolution trees with nodes that unlock abilities, passive bonuses, and mechanics.
  - Respec and branching prestige mechanics allow experimentation.
  - Meta-resources (evolution shards) used for high-impact transverse upgrades.

4) World/Metagame Layer (Layer 4)
  - Multiple biomes/worlds with differing rules, modifiers, and economies.
  - Players progress between worlds using gateways/prestige that reconfigure goals.
  - Events, seasonal modifiers, and live competitions.

5) Strategic/Competitive Layer (Layer 5)
  - Guilds/alliances, trading, limited market, asynchronous PvP or leaderboard races.
  - Long-term goals: artifacts, grand achievements, player-run markets.

Combining layers: Clicks fuel producers which unlock evolution nodes; evolution opens new worlds which enable strategic interactions and competitive meta-goals.

Progression pacing for ~2 years
- Use a multi-timescale reward curve: minutes (clicks), hours (producer upgrades), weeks (evolution trees), months (world unlocks), years (artifacts/competitive seasons).
- Implement logarithmic scaling with soft caps and prestige resets that convert progress into faster future growth.
- Provide long tails: randomized endgame goals, collectathons, procedurally generated challenges, seasonal content.

Balancing and analytics
- Expose tuning variables through the Vue admin dashboard (cost curves, multipliers, drop rates).
- Log telemetry for session lengths, retention, and resource curves; build automated scripts to detect inflation or dead-end progression.

## Persistence & Multiplayer
- Local save (IndexedDB) with periodic sync to server to support cross-device play.
- Backend endpoints: /save, /load, /leaderboard, /player, /admin/events.
- Use server-side authoritative simulations for competitive modes or daily challenges.

## CI / CD / Deployment strategy

- Frontend and admin are static sites (Vite builds) deployable to GitHub Pages, Netlify, and Vercel.
- Backend (FastAPI) deploys to hosts like Fly, Render, or can be packaged in Docker and deployed to Cloud Run/Azure/etc. GitHub Actions will include workflows to build and optionally deploy when secrets are present.
- Unity builds can be exported to WebGL and integrated into the `frontend/public/` folder, or hosted separately.

## Developer workflow
- Monorepo with top-level scripts to bootstrap each workspace. Use `pnpm` or `npm` workspaces for JS side if desired.
- Use GitHub Actions to run tests, build assets, and publish artifacts. Include optional Netlify/Vercel steps that run only if tokens/secrets are set.

## Next steps (implementation roadmap)
1. Scaffold monorepo with example React + Three.js starter and Vue admin starter.
2. Implement minimal FastAPI backend with save/load endpoints and local dev instructions.
3. Add simple Unity C# sample to demonstrate integration and export notes.
4. Create GitHub Actions workflows to build both frontends and deploy to GitHub Pages; add optional Netlify/Vercel deploy steps using CLI and secrets.
