import type { Camera, Doc, Node, NodeID, FrameNode, RectNode, TextNode } from "../types";
import type { EnginePort, Hit } from "./port";

function screenToWorld(camera: Camera, p: { x: number; y: number }) {
  return { x: p.x / camera.scale + camera.x, y: p.y / camera.scale + camera.y };
}

function approxTextWidth(n: TextNode): number {
  // 간단한 근사치: 평균 0.6em 가정 (MVP용)
  const size = n.fontSize ?? 16;
  return (n.text?.length ?? 0) * size * 0.6;
}

function worldOf(doc: Doc, id: NodeID): { x: number; y: number } {
  let x = 0, y = 0;
  let cur: Node | null = (doc.nodes[id] as Node | undefined) ?? null;
  while (cur) {
    x += cur.x; y += cur.y;
    cur = cur.parentId ? ((doc.nodes[cur.parentId] as Node | undefined) ?? null) : null;
  }
  return { x, y };
}

function pointInRect(px: number, py: number, x: number, y: number, w: number, h: number) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function hitNode(doc: Doc, node: Node, worldPt: { x: number; y: number }): NodeID | null {
  const pos = worldOf(doc, node.id);
  const lx = worldPt.x - pos.x;
  const ly = worldPt.y - pos.y;

  if (node.type === "frame") {
    const f = node as FrameNode;
    const inside = pointInRect(lx, ly, 0, 0, f.w, f.h);
    // children 우선, topmost부터
    if (!f.clipsContent || inside) {
      for (let i = f.children.length - 1; i >= 0; i--) {
        const child = doc.nodes[f.children[i]!];
        if (!child) continue;
        const hit = hitNode(doc, child, worldPt);
        if (hit) return hit;
      }
    }
    return inside ? f.id : null;
  } else if (node.type === "rect") {
    const r = node as RectNode;
    return pointInRect(lx, ly, 0, 0, r.w, r.h) ? r.id : null;
  } else {
    const t = node as TextNode;
    const w = approxTextWidth(t);
    const h = t.fontSize ?? 16;
    return pointInRect(lx, ly, 0, 0, w, h) ? t.id : null;
  }
}

export const pureEngine: EnginePort = {
  hitTest(doc, camera, screenPt): Hit | null {
    const world = screenToWorld(camera, screenPt);
    const root = doc.nodes[doc.rootId] as FrameNode;
    // 루트는 그리지 않고 자식만 대상
    for (let i = root.children.length - 1; i >= 0; i--) {
      const n = doc.nodes[root.children[i]!];
      if (!n) continue;
      const hit = hitNode(doc, n, world);
      if (hit) {
        const pos = worldOf(doc, hit);
        return { id: hit, local: { x: world.x - pos.x, y: world.y - pos.y } };
      }
    }
    return null;
  },

  worldRectOf(doc, id) {
    const n = doc.nodes[id];
    const pos = worldOf(doc, id);
    if (!n) return { x: pos.x, y: pos.y, w: 0, h: 0 };
    if (n.type === "text") {
      const t = n as TextNode;
      const w = approxTextWidth(t);
      const h = t.fontSize ?? 16;
      return { x: pos.x, y: pos.y, w, h };
    } else if (n.type === "rect" || n.type === "frame") {
      const s = n as any;
      return { x: pos.x, y: pos.y, w: s.w, h: s.h };
    } else {
      return { x: pos.x, y: pos.y, w: 0, h: 0 };
    }
  }
};
