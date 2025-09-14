# Repository Guidelines

Minimal React node‑editor demo. DOM‑only rendering; strict Engine Port. A Rust/wasm core can replace the TS engine by matching `EnginePort`.

## Structure
- `src/types.ts` — types
- `src/engine/port.ts` — `hitTest`, `worldRectOf`
- `src/engine/pure.ts` — pure TS engine (math)
- `src/store.ts` — Zustand state
- `src/components/` — `DivScene.tsx`, `Viewport.tsx`
- `src/App.tsx`, `src/main.tsx`, `index.html`

Prefer small modules. UI → `src/components/`; engine → `src/engine/`. No Canvas/WebGL.

Rule: If a file gets long (≈200+ lines), split it into smaller focused modules.

## Commands
- `npm run dev`, `npm run typecheck`, `npm run build`, `npm run preview`
- Node 20.18.3 (`.tool-versions` / `.nvmrc`)

## Style
- 2‑space, LF; TypeScript + React 18
- Keep diffs tight; no ESLint/Prettier
- Minimize `as Type`; use discriminated unions/explicit typings

## Testing
- No framework. Propose plan first; prefer small engine unit tests.

## PRs
- Include purpose/scope, UI screenshots/GIFs, Engine Port impact.

## Architecture
- Engine Port is the boundary; UI independent of engine internals
- Default `pureEngine`; wasm must implement `hitTest`/`worldRectOf`
- DOM rendering only; overlays in React; math in engine
