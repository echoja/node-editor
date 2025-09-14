import React from "react";
import type { Camera, Doc, NodeID } from "../types";
import type { EnginePort } from "../engine/port";
import { screenRectOf } from "../utils/overlay";

type Props = {
  doc: Doc;
  camera: Camera;
  selection: NodeID[];
  engine: EnginePort;
  // 추후 사이즈 조정 시작 시그널을 연결할 수 있도록 미리 훅 제공
  onResizeStart?: (id: NodeID, handle: HandleId, e: React.PointerEvent) => void;
};

type HandleId =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

export const ResizeHandlesOverlay: React.FC<Props> = ({ doc, camera, selection, engine, onResizeStart }) => {
  if (selection.length !== 1) return null;
  const id = selection[0]!;
  const r = screenRectOf(engine, doc, camera, id);

  // 텍스트/사각형/프레임 등에 공통 표시. 실제 resize 로직은 추후 연결
  const size = 7;
  const half = Math.floor(size / 2);
  const handles: Array<{ key: HandleId; x: number; y: number; cursor: React.CSSProperties["cursor"] }> = [
    { key: "nw", x: r.x - half, y: r.y - half, cursor: "nwse-resize" },
    { key: "n",  x: r.x + r.w / 2 - half, y: r.y - half, cursor: "ns-resize" },
    { key: "ne", x: r.x + r.w - half, y: r.y - half, cursor: "nesw-resize" },
    { key: "w",  x: r.x - half, y: r.y + r.h / 2 - half, cursor: "ew-resize" },
    { key: "e",  x: r.x + r.w - half, y: r.y + r.h / 2 - half, cursor: "ew-resize" },
    { key: "sw", x: r.x - half, y: r.y + r.h - half, cursor: "nesw-resize" },
    { key: "s",  x: r.x + r.w / 2 - half, y: r.y + r.h - half, cursor: "ns-resize" },
    { key: "se", x: r.x + r.w - half, y: r.y + r.h - half, cursor: "nwse-resize" },
  ];

  const common: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    background: "#3b82f6",
    border: "1px solid #fff",
    borderRadius: 2,
    boxSizing: "border-box",
    pointerEvents: "auto", // 그룹 컨테이너는 none; 핸들은 인터랙션 허용
  };

  return (
    <>
      {handles.map((h) => (
        <div
          key={h.key}
          role="button"
          aria-label={`resize-${h.key}`}
          data-handle={h.key}
          style={{ ...common, left: Math.round(h.x), top: Math.round(h.y), cursor: h.cursor }}
          onPointerDown={(e) => onResizeStart?.(id, h.key, e)}
        />
      ))}
    </>
  );
};

