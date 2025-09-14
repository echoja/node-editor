import React, { useMemo } from "react";
import type { Camera, Doc, NodeID } from "../types";
import type { EnginePort } from "../engine/port";
import { SelectionOverlay } from "./SelectionOverlay";
import { ResizeHandlesOverlay } from "./ResizeHandlesOverlay";
import { ZoomControls } from "./ZoomControls";
import { DebugOverlay } from "./DebugOverlay";
import { useEditor } from "../store";
import { pureEngine } from "../engine/pure";

export const OverlayGroup: React.FC = ({}) => {
  const doc = useEditor((s) => s.doc);
  const camera = useEditor((s) => s.camera);
  const selection = useEditor((s) => s.selection);
  const engine: EnginePort = useMemo(() => pureEngine, []);

  const wrap: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none", // 기본은 통과; 하위 개별 오버레이에서 필요 시 auto
  };

  return (
    <div style={wrap} aria-label="overlay-group">
      <SelectionOverlay
        doc={doc}
        camera={camera}
        selection={selection}
        engine={engine}
      />
      <ResizeHandlesOverlay
        doc={doc}
        camera={camera}
        selection={selection}
        engine={engine}
      />
      <ZoomControls />
      <DebugOverlay camera={camera} />
    </div>
  );
};
