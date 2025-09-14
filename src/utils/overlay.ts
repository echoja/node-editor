import type { Camera, Doc, NodeID } from "../types";
import type { EnginePort } from "../engine/port";

export type ScreenRect = { x: number; y: number; w: number; h: number };

export function screenRectOf(
  engine: EnginePort,
  doc: Doc,
  camera: Camera,
  id: NodeID
): ScreenRect {
  const r = engine.worldRectOf(doc, id);
  const sx = (r.x - camera.x) * camera.scale;
  const sy = (r.y - camera.y) * camera.scale;
  const sw = r.w * camera.scale;
  const sh = r.h * camera.scale;
  return {
    x: Math.round(sx),
    y: Math.round(sy),
    w: Math.max(0, Math.round(sw)),
    h: Math.max(0, Math.round(sh)),
  };
}

