import type { Camera } from "../../types";
import { worldToScreenRect } from "../layout";

export type Rect = { x: number; y: number; w: number; h: number };

export function absPreviewWorldRect(pointerWorld: { x: number; y: number }, fromWorld: Rect, local: { x: number; y: number }): Rect {
  return {
    x: pointerWorld.x - local.x,
    y: pointerWorld.y - local.y,
    w: fromWorld.w,
    h: fromWorld.h,
  };
}

