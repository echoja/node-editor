import type { Camera, Doc, Node, NodeID, FrameNode, TextNode } from "../types";
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
  // DOM 절대 위치는 부모의 padding box(= 안쪽 테두리) 기준입니다.
  // 프레임의 border(stroke)가 있으면 자식의 (0,0)은 border 두께만큼 안쪽으로 이동합니다.
  // 엔진 좌표도 동일하게 맞추기 위해 각 조상 프레임의 strokeWidth를 누적합니다.
  let x = 0, y = 0;
  let cur: Node | null = doc.nodes[id] ?? null;
  while (cur) {
    x += cur.x; y += cur.y;
    const parent: Node | null = cur.parentId ? (doc.nodes[cur.parentId] ?? null) : null;
    if (parent && parent.type === "frame") {
      const bw = parent.strokeWidth ?? (parent.stroke ? 1 : 0);
      if (bw) { x += bw; y += bw; }
    }
    cur = parent;
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
    const inside = pointInRect(lx, ly, 0, 0, node.w, node.h);
    // children 우선, topmost부터
    if (!node.clipsContent || inside) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        const child = doc.nodes[node.children[i]!];
        if (!child) continue;
        const hit = hitNode(doc, child, worldPt);
        if (hit) return hit;
      }
    }
    return inside ? node.id : null;
  }
  if (node.type === "rect") {
    return pointInRect(lx, ly, 0, 0, node.w, node.h) ? node.id : null;
  }
  // text
  if (node.type === "text") {
    const w = approxTextWidth(node);
    const h = node.fontSize ?? 16;
    return pointInRect(lx, ly, 0, 0, w, h) ? node.id : null;
  }
  return null;
}

export const pureEngine: EnginePort = {
  hitTest(doc, camera, screenPt): Hit | null {
    const world = screenToWorld(camera, screenPt);
    const root = doc.nodes[doc.rootId];
    if (!root || root.type !== "frame") return null;
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
      const w = approxTextWidth(n);
      const h = n.fontSize ?? 16;
      return { x: pos.x, y: pos.y, w, h };
    }
    if (n.type === "rect" || n.type === "frame") {
      return { x: pos.x, y: pos.y, w: n.w, h: n.h };
    }
    return { x: pos.x, y: pos.y, w: 0, h: 0 };
  }
};
