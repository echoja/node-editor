# Repository Guidelines

This repo is a minimal React + SVG editor that demonstrates the node-editor core with a strict Engine Port. Keep rendering DOM/SVG-only and preserve the Engine Port so a Rust/wasm core can replace the TS engine later.

## Project Structure & Module Organization
- `src/types.ts` — document/camera/node types
- `src/engine/port.ts` — Engine Port (`hitTest`, `worldRectOf`)
- `src/engine/pure.ts` — pure TS engine (math only)
- `src/store.ts` — Zustand state (doc/camera/selection)
- `src/components/` — `SvgScene.tsx`, `Viewport.tsx`
- `src/App.tsx`, `src/main.tsx`, `index.html`

Prefer small, focused modules. New UI → `src/components/`. Engine logic → `src/engine/`. Do not introduce Canvas/WebGL.

## Build, Test, and Development Commands
- `npm run dev` – start Vite dev server
- `npm run typecheck` – TypeScript checks
- `npm run build` – production build
- `npm run preview` – serve built assets

Node version: use `.tool-versions` or `.nvmrc` (20.18.3).

## Coding Style & Naming Conventions
- 2-space indentation, LF endings (`.editorconfig`, `.gitattributes`)
- TypeScript + React 18
- File names: components `PascalCase.tsx` (e.g., `MyPanel.tsx`); utilities `camelCase.ts` (e.g., `computeBounds.ts`)
- Props/state names use `camelCase`; types/interfaces use `PascalCase`
- ESLint/Prettier are intentionally not used; keep diffs tight and readable

## Testing Guidelines
No test framework is installed. If you add tests, propose the plan first. Prefer lightweight, local unit tests (e.g., engine math). Suggested layout: `src/**/__tests__/*.test.ts`.

## Commit & Pull Request Guidelines
- Commits: imperative, present tense; scope first when helpful
  - Examples: `Add resize handles`, `Refactor hitTest traversal`, `Fix pan wheel anchor`
- PRs must include:
  - Purpose and scope (what/why)
  - Screens/GIFs for UI changes
  - Notes on Engine Port impact (unchanged, extended, or breaking)

## Architecture Notes (must-read)
- Engine Port is the boundary. Do not couple UI to engine internals.
- Keep `pureEngine` as default. A wasm core must match `EnginePort` shape.
- Maintain DOM/SVG rendering; overlay/inspector lives in React; math lives in engine.
