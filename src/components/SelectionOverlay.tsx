import React from "react";
import type { Camera, Doc, NodeID } from "../types";
import { screenRectOf } from "../utils/overlay";
import { useEngine } from "../lib/engineContext";

type Props = {
  doc: Doc;
  camera: Camera;
  selection: NodeID[];
};

export const SelectionOverlay: React.FC<Props> = React.memo(({ doc, camera, selection }) => {
  const engine = useEngine();
  if (selection.length !== 1) return null;
  const id = selection[0]!;
  const { x: sx, y: sy, w: sw, h: sh } = screenRectOf(engine, doc, camera, id);
  const style: React.CSSProperties = {
    position: "absolute",
    left: sx,
    top: sy,
    width: sw,
    height: sh,
    border: "1px dashed #3b82f6",
    pointerEvents: "none",
    boxSizing: "border-box",
  };
  return <div style={style} />;
});
