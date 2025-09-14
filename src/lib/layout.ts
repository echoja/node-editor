import type { Camera, Doc, NodeID } from "../types";
import type { EnginePort } from "../engine/port";

export type Rect = { x: number; y: number; w: number; h: number };

// local rect (parent-content local) using engine world rects
export function localRectOf(engine: EnginePort, doc: Doc, id: NodeID): Rect {
  const n = doc.nodes[id];
  if (!n) return { x: 0, y: 0, w: 0, h: 0 };
  const w = engine.worldRectOf(doc, id);
  const pid = n.parentId;
  if (!pid) return w; // root relative
  const p = doc.nodes[pid]!;
  const pw = engine.worldRectOf(doc, pid);
  const bw = p.type === "frame" ? (p.strokeWidth ?? (p.stroke ? 1 : 0)) : 0;
  return { x: w.x - pw.x - bw, y: w.y - pw.y - bw, w: w.w, h: w.h };
}

// convert world rect to screen via camera
export function worldToScreenRect(cam: Camera, r: Rect): Rect {
  return {
    x: Math.round((r.x - cam.x) * cam.scale),
    y: Math.round((r.y - cam.y) * cam.scale),
    w: Math.max(0, Math.round(r.w * cam.scale)),
    h: Math.max(0, Math.round(r.h * cam.scale)),
  };
}

