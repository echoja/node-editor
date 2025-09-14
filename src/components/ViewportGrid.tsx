import React from "react";

export const ViewportGrid: React.FC = () => {
  // 월드 좌표계 고정 그리드 (줌과 함께 스케일)
  const step = 50; // world units
  const span = 20000; // cover a large area
  const style: React.CSSProperties = {
    position: "absolute",
    left: -span / 2,
    top: -span / 2,
    width: span,
    height: span,
    backgroundImage:
      `repeating-linear-gradient(0deg, #eee, #eee 1px, transparent 1px, transparent ${step}px),` +
      `repeating-linear-gradient(90deg, #eee, #eee 1px, transparent 1px, transparent ${step}px)`,
    backgroundPosition: "0 0, 0 0",
    backgroundSize: `${step}px ${step}px, ${step}px ${step}px`,
    pointerEvents: "none",
  };
  return <div style={style} />;
};

