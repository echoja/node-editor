import React, { useMemo } from "react";
import type { Camera } from "../types";

export const DebugOverlay: React.FC<{ camera: Camera }> = ({ camera }) => {
  const show = useMemo(() => {
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    const val = sp.get("debug");
    return val === "" || val === "1" || val === "true" || val === "yes" || sp.has("debug");
  }, []);
  if (!show) return null;

  const wrap: React.CSSProperties = {
    position: "absolute",
    left: 8,
    bottom: 8,
    padding: "6px 8px",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 12,
    borderRadius: 6,
    pointerEvents: "none",
    whiteSpace: "pre",
  };

  return (
    <div style={wrap} aria-label="camera-debug">
      x: {camera.x.toFixed(2)}  y: {camera.y.toFixed(2)}  scale: {camera.scale.toFixed(3)}
    </div>
  );
};

