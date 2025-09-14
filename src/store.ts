import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Camera,
  Doc,
  FrameNode,
  NodeID,
  RectNode,
  TextNode,
} from "./types";
import { pureEngine } from "./engine/pure";

type DragState = {
  id: NodeID | null;
  kind: "moveAbs" | "reorderRel" | null;
  parentId: NodeID | null;
  fromWorld: { x: number; y: number; w: number; h: number } | null;
  local: { x: number; y: number } | null; // pointer->node offset
  previewWorld: { x: number; y: number; w: number; h: number } | null;
  hoverIndex: number | null; // for reorder
  activated: boolean;
  startScreen: { x: number; y: number } | null;
};

type EditorState = {
  doc: Doc;
  camera: Camera;
  selection: NodeID[];
  drag: DragState;
  actions: {
    setCamera: (cam: Partial<Camera>) => void;
    select: (ids: NodeID[]) => void;
    moveNodeTo: (id: NodeID, x: number, y: number) => void;
    setDrag: (next: Partial<DragState>) => void;
    clearDrag: () => void;
    reorderRelative: (
      parentId: NodeID,
      draggingId: NodeID,
      toIndex: number
    ) => void;
    togglePosition: (id: NodeID) => void;
  };
};

function id(prefix = "n") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const rootId = "root";
const frameA = id("frame");
const rect1 = id("rect");
const text1 = id("text");

const rootFrame: FrameNode = {
  id: rootId,
  type: "frame",
  parentId: null,
  name: "Root",
  x: 0,
  y: 0,
  w: 8000,
  h: 6000,
  clipsContent: false,
  children: [frameA],
};
const frameANode: FrameNode = {
  id: frameA,
  type: "frame",
  parentId: rootId,
  name: "Frame A",
  x: 200,
  y: 160,
  w: 600,
  h: 400,
  background: "#fafafa",
  stroke: "#ddd",
  clipsContent: true,
  children: [rect1, text1],
};
const rect1Node: RectNode = {
  id: rect1,
  type: "rect",
  parentId: frameA,
  name: "Rect 1",
  x: 60,
  y: 0,
  w: 220,
  h: 140,
  fill: "#dbeafe",
  stroke: "#1e3a8a",
  position: "relative",
};
const text1Node: TextNode = {
  id: text1,
  type: "text",
  parentId: frameA,
  name: "Hello",
  x: 80,
  y: 0,
  text: "Hello, Frame!",
  fontSize: 18,
  fill: "#111",
  position: "relative",
};

const initialDoc: Doc = {
  version: 1,
  rootId,
  nodes: {
    [rootId]: rootFrame,
    [frameA]: frameANode,
    [rect1]: rect1Node,
    [text1]: text1Node,
  },
};

export const useEditor = create<EditorState>()(
  immer((set) => ({
    doc: initialDoc,
    camera: { x: 0, y: 0, scale: 1 },
    selection: [],
    drag: {
      id: null,
      kind: null,
      parentId: null,
      fromWorld: null,
      local: null,
      previewWorld: null,
      hoverIndex: null,
      activated: false,
      startScreen: null,
    },
    actions: {
      setCamera: (cam) =>
        set((s) => {
          s.camera = { ...s.camera, ...cam };
        }),
      select: (ids) =>
        set((s) => {
          s.selection = ids;
        }),
      moveNodeTo: (id, x, y) =>
        set((s) => {
          const n = s.doc.nodes[id];
          if (n) {
            n.x = x;
            n.y = y;
          }
        }),
      setDrag: (next) =>
        set((s) => {
          s.drag = { ...s.drag, ...next };
        }),
      clearDrag: () =>
        set((s) => {
          s.drag = {
            id: null,
            kind: null,
            parentId: null,
            fromWorld: null,
            local: null,
            previewWorld: null,
            hoverIndex: null,
            activated: false,
            startScreen: null,
          };
        }),
      reorderRelative: (parentId, draggingId, toIndex) =>
        set((s) => {
          const p = s.doc.nodes[parentId];
          if (!p || p.type !== "frame") return;
          // base children without the dragging id (to avoid duplication when it was absolute)
          const base = p.children.filter((cid) => cid !== draggingId);
          // indices in base that are relative nodes
          const relPositions: number[] = [];
          const relIds: NodeID[] = [];
          base.forEach((cid, i) => {
            const n = s.doc.nodes[cid];
            if (n && (n.position ?? "absolute") === "relative") {
              relPositions.push(i);
              relIds.push(cid);
            }
          });
          const filtered = relIds.slice();
          const clamped = Math.max(0, Math.min(filtered.length, toIndex));
          filtered.splice(clamped, 0, draggingId);
          const next = base.slice();
          relPositions.forEach((pos, i) => {
            next[pos] = filtered[i]!;
          });
          p.children = next;
        }),
      togglePosition: (id) =>
        set((s) => {
          const n = s.doc.nodes[id];
          if (!n) return;
          const parent = n.parentId ? s.doc.nodes[n.parentId] : null;
          if (!parent || parent.type !== "frame") {
            n.position = n.position === "relative" ? "absolute" : "relative";
            return;
          }
          if ((n.position ?? "absolute") === "relative") {
            // relative -> absolute: keep current visual position
            const pw = pureEngine.worldRectOf(s.doc, parent.id);
            const bw = parent.strokeWidth ?? (parent.stroke ? 1 : 0);
            const ww = pureEngine.worldRectOf(s.doc, id);
            n.x = ww.x - pw.x - (bw || 0);
            n.y = ww.y - pw.y - (bw || 0);
            n.position = "absolute";
          } else {
            // absolute -> relative: insert into vstack near current Y
            n.position = "relative";
            const w = pureEngine.worldRectOf(s.doc, id);
            const cy = w.y + w.h / 2;
            // compute insertion index among relative children
            const relIds: NodeID[] = parent.children.filter((cid) => {
              const c = s.doc.nodes[cid]!;
              return (c.position ?? "absolute") === "relative" && c.id !== id;
            });
            let toIndex = 0;
            const mids = relIds.map((cid) => {
              const r = pureEngine.worldRectOf(s.doc, cid);
              return r.y + r.h / 2;
            });
            for (let i = 0; i < mids.length; i++) {
              if (cy < mids[i]!) {
                toIndex = i;
                break;
              }
              toIndex = i + 1;
            }
            // now reorder only relative subsequence (including id)
            const positions: number[] = [];
            const relSeq: NodeID[] = [];
            parent.children.forEach((cid, i) => {
              const c = s.doc.nodes[cid]!;
              if ((c.position ?? "absolute") === "relative" || c.id === id) {
                positions.push(i);
                if (c.id !== id) relSeq.push(c.id);
              }
            });
            const filtered = relSeq.slice();
            const clamped = Math.max(0, Math.min(filtered.length, toIndex));
            filtered.splice(clamped, 0, id);
            const base = parent.children.filter((cid) => cid !== id);
            const next = base.slice();
            positions.forEach((pos, i) => {
              next[pos] = filtered[i]!;
            });
            parent.children = next;
          }
        }),
    },
  }))
);
