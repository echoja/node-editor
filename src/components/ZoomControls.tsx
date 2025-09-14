import React from "react";
import { useEditor } from "../store";

export const ZoomControls: React.FC = () => {
  const { setCamera } = useEditor((s) => s.actions);
  const camera = useEditor((s) => s.camera);

  const onZoomIn = () => {
    setCamera({ scale: camera.scale * 1.2 });
  };

  const onZoomOut = () => {
    setCamera({ scale: camera.scale / 1.2 });
  };

  const onReset = () => {
    setCamera({ scale: 1 });
  };

  const wrap: React.CSSProperties = {
    position: "absolute",
    right: 8,
    top: 8,
    display: "flex",
    gap: 6,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: 6,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    pointerEvents: "auto"
  };
  const btn: React.CSSProperties = {
    appearance: "none",
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "4px 8px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  };
  return (
    <div style={wrap}>
      <button style={btn} onClick={onZoomOut} aria-label="Zoom Out">
        -
      </button>
      <button style={btn} onClick={onZoomIn} aria-label="Zoom In">
        +
      </button>
      {onReset ? (
        <button style={btn} onClick={onReset} aria-label="Reset Zoom">
          100%
        </button>
      ) : null}
    </div>
  );
};
