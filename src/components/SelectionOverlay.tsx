import React from "react";
import type { Camera, Doc, NodeID } from "../types";
import type { EnginePort } from "../engine/port";

type Props = {
  doc: Doc;
  camera: Camera;
  selection: NodeID[];
  engine: EnginePort;
};

export const SelectionOverlay: React.FC<Props> = React.memo(({ doc, camera, selection, engine }) => {
  if (selection.length !== 1) return null;
  const id = selection[0]!;
  const r = engine.worldRectOf(doc, id);
  const sx = (r.x - camera.x) * camera.scale;
  const sy = (r.y - camera.y) * camera.scale;
  const sw = r.w * camera.scale;
  const sh = r.h * camera.scale;
  const style: React.CSSProperties = {
    position: "absolute",
    left: Math.round(sx),
    top: Math.round(sy),
    width: Math.max(0, Math.round(sw)),
    height: Math.max(0, Math.round(sh)),
    border: "1px dashed #3b82f6",
    pointerEvents: "none",
    boxSizing: "border-box",
  };
  return <div style={style} />;
});

