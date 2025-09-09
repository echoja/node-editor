import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Camera, Doc, FrameNode, NodeID, RectNode, TextNode } from "./types";

type EditorState = {
  doc: Doc;
  camera: Camera;
  selection: NodeID[];
  actions: {
    setCamera: (cam: Partial<Camera>) => void;
    select: (ids: NodeID[]) => void;
    moveNodeTo: (id: NodeID, x: number, y: number) => void;
  };
};

function id(prefix = "n") { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }

const rootId = "root";
const frameA = id("frame");
const rect1 = id("rect");
const text1 = id("text");

const rootFrame: FrameNode = { id: rootId, type: "frame", parentId: null, name: "Root", x: 0, y: 0, w: 8000, h: 6000, clipsContent: false, children: [frameA] };
const frameANode: FrameNode = { id: frameA, type: "frame", parentId: rootId, name: "Frame A", x: 200, y: 160, w: 600, h: 400, background: "#fafafa", stroke: "#ddd", clipsContent: true, children: [rect1, text1] };
const rect1Node: RectNode  = { id: rect1,  type: "rect",  parentId: frameA, name: "Rect 1", x: 60,  y: 60,  w: 220, h: 140, fill: "#dbeafe", stroke: "#1e3a8a" };
const text1Node: TextNode  = { id: text1,  type: "text",  parentId: frameA, name: "Hello",   x: 80,  y: 240, text: "Hello, Frame!", fontSize: 18, fill: "#111" };

const initialDoc: Doc = {
  version: 1,
  rootId,
  nodes: {
    [rootId]: rootFrame,
    [frameA]: frameANode,
    [rect1]: rect1Node,
    [text1]: text1Node,
  }
};

export const useEditor = create<EditorState>()(immer((set) => ({
  doc: initialDoc,
  camera: { x: 0, y: 0, scale: 1 },
  selection: [],
  actions: {
    setCamera: (cam) => set(s => { s.camera = { ...s.camera, ...cam }; }),
    select: (ids) => set(s => { s.selection = ids; }),
    moveNodeTo: (id, x, y) => set(s => { const n = s.doc.nodes[id]; if (n) { n.x = x; n.y = y; } }),
  }
})));
