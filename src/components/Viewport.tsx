import React, { useRef } from "react";
import { useEditor } from "../store";
import { DivScene } from "./DivScene";
import { ViewportGrid } from "./ViewportGrid";
import { useViewportPanZoom } from "../hooks/useViewportPanZoom";
import { useViewportDnD } from "../hooks/useViewportDnD";

export const Viewport: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const doc = useEditor((s) => s.doc);
  const camera = useEditor((s) => s.camera);
  const { setCamera } = useEditor((s) => s.actions);

  const { isSpacePressed, isPanning } = useViewportPanZoom({
    rootRef,
    camera,
    setCamera,
  });
  useViewportDnD({ rootRef, camera, isSpacePressed });

  // 선택 박스는 별도 오버레이 컴포넌트에서 렌더링

  const worldStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transform: `translate(${-camera.x * camera.scale}px, ${
      -camera.y * camera.scale
    }px) scale(${camera.scale})`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  return (
    <div
      className="root"
      ref={rootRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#fff",
        overflow: "hidden",
        cursor: isPanning ? "grabbing" : isSpacePressed ? "grab" : "default",
      }}
    >
      {/* 월드 레이어 (카메라 변환 적용) */}
      <div style={worldStyle}>
        <ViewportGrid />
        <DivScene doc={doc} />
      </div>
    </div>
  );
};
