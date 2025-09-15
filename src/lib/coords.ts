import type { Camera, Doc, NodeID } from "../types";

export function screenToWorld(p: { x: number; y: number }, cam: Camera) {
  return { x: p.x / cam.scale + cam.x, y: p.y / cam.scale + cam.y };
}

export function worldOfAncestors(d: Doc, parentId: NodeID | null) {
  // 엔진의 worldOf와 동일 규칙: 조상 프레임의 border(stroke) 두께를 누적
  let x = 0,
    y = 0;
  let cur = parentId ? d.nodes[parentId] : null;
  while (cur) {
    x += cur.x;
    y += cur.y;
    const parent = cur.parentId ? d.nodes[cur.parentId] : null;
    if (parent && parent.type === "frame") {
      const bw = parent.strokeWidth ?? (parent.stroke ? 1 : 0);
      if (bw) {
        x += bw;
        y += bw;
      }
    }
    cur = parent;
  }
  return { x, y };
}
