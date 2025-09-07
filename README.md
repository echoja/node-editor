# node-editor — React + SVG Demo (Engine Port Ready)

This repository is a minimal, working demo that implements the core concepts of a node-based editor using Pure React (DOM/SVG only). It intentionally maintains a strict engine boundary (Port) so the TypeScript engine can later be swapped with a Rust/wasm core without changing the React renderer and UI.

Goals
- Demonstrate the editor model and interactions with the simplest stack possible.
- Keep rendering in React + SVG; make engine math swappable (TS ↔ wasm) via a small Port.
- Keep the code easy to read and fork for experiments.

Non-Goals
- Production scalability for huge documents (DOM/SVG has limits).
- Pixel-perfect text metrics and advanced typography.
- Comprehensive tools (resize/rotate/booleans, etc.) — this is a foundation.

What’s Included
- Frame nodes with children and optional clipping.
- Rect and Text nodes.
- Selection outline, drag move, pan/zoom to cursor, simple grid.
- Inspector to edit X/Y of the selected node.
- A pure TypeScript engine for hit-testing and world bounds, behind a small Port.

Quick Start
- Node: use `.tool-versions` (asdf) or `.nvmrc` (nvm) → Node 20.18.3
- Install: `npm install`
- Dev: `npm run dev`
- Typecheck: `npm run typecheck`
- Build: `npm run build` then `npm run preview`

Controls
- Select: Left-click
- Move: Drag selected node
- Pan: Alt/Option (or Ctrl/Command) + drag, or Middle mouse drag
- Zoom: Mouse wheel (zooms to cursor position)

Repository Layout
- `src/types.ts` — Document, nodes, and camera types (Frame includes `children`, `clipsContent`).
- `src/engine/port.ts` — Engine Port interface (`hitTest`, `worldRectOf`).
- `src/engine/pure.ts` — Pure TS engine (math only; no DOM/Canvas).
- `src/store.ts` — Zustand state: `doc`, `camera`, `selection`, actions.
- `src/components/SvgScene.tsx` — Renders Doc to SVG (clipPath for frames).
- `src/components/Viewport.tsx` — SVG viewport: pan/zoom/select/move, selection outline.
- `src/App.tsx`, `src/main.tsx`, `index.html` — App scaffolding.
- Meta: `.tool-versions`, `.nvmrc`, `.editorconfig`, `.gitattributes`, `.gitignore`.

Data Model
- Coordinates: each node’s `x/y` are parent-local. `FrameNode` and `RectNode` carry `w/h`.
- Root: an invisible world frame that contains top-level nodes.
- Types: `FrameNode | RectNode | TextNode`.

Example Document
```json
{
  "version": 1,
  "rootId": "root",
  "nodes": {
    "root": { "id": "root", "type": "frame", "parentId": null, "x": 0, "y": 0, "w": 8000, "h": 6000, "clipsContent": false, "children": ["frame_A"] },
    "frame_A": { "id": "frame_A", "type": "frame", "parentId": "root", "x": 200, "y": 160, "w": 600, "h": 400, "clipsContent": true, "children": ["rect_1", "text_1"] },
    "rect_1": { "id": "rect_1", "type": "rect", "parentId": "frame_A", "x": 60, "y": 60, "w": 220, "h": 140, "fill": "#dbeafe" },
    "text_1": { "id": "text_1", "type": "text", "parentId": "frame_A", "x": 80, "y": 240, "text": "Hello, Frame!", "fontSize": 18 }
  }
}
```

Engine Port
```ts
export interface EnginePort {
  hitTest(doc: Doc, camera: Camera, screenPt: { x: number; y: number }): Hit | null;
  worldRectOf(doc: Doc, id: NodeID): { x: number; y: number; w: number; h: number };
}
```
- The React/SVG layer calls this Port only. Today it binds to `pureEngine` (TypeScript).
- A Rust/wasm core can expose the same API (via wasm-bindgen or cbindgen + glue) to swap in.

Coordinate Spaces
- Parent-local: node’s `x/y` are relative to its parent.
- World: accumulated parent `x/y` up the tree.
- Screen: world transformed by camera.
- In code, `world → screen` is applied at the top SVG group: `translate(-camera.x, -camera.y) scale(camera.scale)`.
- Helper: `screenToWorld(p) = { x: p.x / scale + x, y: p.y / scale + y }`.

Hit-Testing Rule
- Frames test children first in reverse order (topmost-first).
- If `clipsContent` is true, only count hits when inside the frame bounds.
- Otherwise, click-through to children is allowed even when outside the frame rect.

State Flow
- Pointer events are attached to the `<svg>` element in `Viewport`.
- On down: decide `pan` vs `move` based on modifiers; call `engine.hitTest` for selection.
- On move: update camera or recompute node `x/y` using `screenToWorld` and ancestor offset.
- On wheel: exponential zoom, anchored to cursor to keep focus stable.
- Selection outline uses `engine.worldRectOf` and `vectorEffect="non-scaling-stroke"` so it stays 1px on screen.

Why “DOM/SVG only” first?
- Accelerates iteration for UX and data model without Canvas/WebGL boilerplate.
- Keeps wasm surface tight — swap just math (hit-test, bounds, layout) later.
- SVG is good enough for MVPs and moderate node counts.

Limitations
- Single-item selection in the current UI flow (store supports arrays; UI uses first).
- Approximate text width for hit-tests and bounds (can be swapped for DOM measure or wasm shaping later).
- Large documents will need virtualization or off-main-thread work.

Roadmap (suggested)
1. Resize handles and transform tools
2. Undo/redo (command pattern + hotkeys)
3. Save/load (JSON schema with version)
4. Layers panel (reorder children → z-order)
5. Text measurement accuracy (SVG metrics or wasm shaping)
6. Performance for large docs (virtualization, overlay layers)

Project Conventions
- 2-space indentation (`.editorconfig`)
- LF line endings (`.gitattributes`)
- Keep `package-lock.json` committed; ESLint/Prettier intentionally omitted

Troubleshooting
- Middle mouse pan on Mac: use Alt/Option (or Ctrl/Command) + drag.
- Trackpad zoom direction feels inverted: swap at the OS level or invert the wheel delta in `Viewport`.

Acknowledgements
- Built with Vite + React + TypeScript and Zustand.

