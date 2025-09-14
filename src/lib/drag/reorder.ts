import type { Doc, NodeID } from "../../types";
import type { EnginePort } from "../../engine/port";

export function isRelative(doc: Doc, id: NodeID): boolean {
  const n = doc.nodes[id];
  return !!n && ((n as any).position ?? "absolute") === "relative";
}

export function parentOf(doc: Doc, id: NodeID) {
  const n = doc.nodes[id];
  return n?.parentId ? doc.nodes[n.parentId] : null;
}

// Compute insertion index among relative children of parent (vstack)
export function computeHoverIndex(
  doc: Doc,
  engine: EnginePort,
  parentId: NodeID,
  draggingId: NodeID,
  pointerWorldY: number
): number {
  const parent = doc.nodes[parentId];
  if (!parent || parent.type !== "frame") return 0;
  const relIds = parent.children.filter((cid) => cid !== draggingId && isRelative(doc, cid));
  if (relIds.length === 0) return 0;
  const mids = relIds.map((cid) => {
    const r = engine.worldRectOf(doc, cid);
    return r.y + r.h / 2;
  });
  for (let i = 0; i < mids.length; i++) {
    if (pointerWorldY < mids[i]!) return i;
  }
  return mids.length;
}

// Apply reordering to the relative subsequence only; keep absolutes in place
export function applyRelativeReorder(doc: Doc, parentId: NodeID, draggingId: NodeID, toIndex: number): NodeID[] {
  const parent = doc.nodes[parentId];
  if (!parent || parent.type !== "frame") return [];
  const positions: number[] = [];
  const relIds: NodeID[] = [];
  parent.children.forEach((cid, i) => {
    if (isRelative(doc, cid)) { positions.push(i); relIds.push(cid); }
  });
  const filtered = relIds.filter((id) => id !== draggingId);
  const clamped = Math.max(0, Math.min(filtered.length, toIndex));
  filtered.splice(clamped, 0, draggingId);
  const next = parent.children.slice();
  positions.forEach((pos, i) => { next[pos] = filtered[i]!; });
  return next;
}

