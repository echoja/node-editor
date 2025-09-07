import type { Camera, Doc, NodeID } from "../types";

export type Hit = { id: NodeID; local: { x: number; y: number } };

// 엔진 포트: 지금은 TS로, 나중엔 동일 시그니처를 wasm으로 교체 가능
export interface EnginePort {
  hitTest(doc: Doc, camera: Camera, screenPt: { x: number; y: number }): Hit | null;
  worldRectOf(doc: Doc, id: NodeID): { x: number; y: number; w: number; h: number };
}

