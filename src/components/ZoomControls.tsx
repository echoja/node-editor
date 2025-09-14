import React from "react";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset?: () => void;
};

export const ZoomControls: React.FC<Props> = ({ onZoomIn, onZoomOut, onReset }) => {
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
      <button style={btn} onClick={onZoomOut} aria-label="Zoom Out">-</button>
      <button style={btn} onClick={onZoomIn} aria-label="Zoom In">+</button>
      {onReset ? <button style={btn} onClick={onReset} aria-label="Reset Zoom">100%</button> : null}
    </div>
  );
};

