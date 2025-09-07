import React, { useEffect, useMemo, useRef } from "react";
import { useEditor } from "../store";
import { pureEngine } from "../engine/pure";
import type { EnginePort } from "../engine/port";
import { SvgScene } from "./SvgScene";
import type { Doc, NodeID, Camera } from "../types";

export const Viewport: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const engine: EnginePort = useMemo(() => pureEngine, []);
  const doc = useEditor(s => s.doc);
  const camera = useEditor(s => s.camera);
  const selection = useEditor(s => s.selection);
  const { setCamera, select, moveNodeTo } = useEditor(s => s.actions);

  const drag = useRef<{ mode: "pan" | "move" | null; id?: NodeID; local?: { x: number; y: number }; last?: { x: number; y: number } }>({ mode: null });

  function screenToWorld(p: { x: number; y: number }, cam: Camera) {
    return { x: p.x / cam.scale + cam.x, y: p.y / cam.scale + cam.y };
  }
  function getMouse(e: PointerEvent | WheelEvent) {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function worldOfAncestors(d: Doc, parentId: NodeID | null) {
    let x = 0, y = 0;
    let cur = parentId ? d.nodes[parentId] : null;
    while (cur) { x += cur.x; y += cur.y; cur = cur.parentId ? d.nodes[cur.parentId] : null; }
    return { x, y };
  }

  useEffect(() => {
    const svg = svgRef.current!;
    function onDown(e: PointerEvent) {
      svg.setPointerCapture(e.pointerId);
      const mouse = getMouse(e);
      const isPan = e.button === 1 || e.altKey || e.metaKey || e.ctrlKey;
      if (isPan) {
        drag.current = { mode: "pan", last: mouse };
      } else {
        const hit = engine.hitTest(doc, camera, mouse);
        if (hit) {
          select([hit.id]);
          drag.current = { mode: "move", id: hit.id, local: hit.local };
        } else {
          select([]);
          drag.current = { mode: null };
        }
      }
    }
    function onMove(e: PointerEvent) {
      const m = drag.current;
      if (!m.mode) return;
      const mouse = getMouse(e);
      if (m.mode === "pan" && m.last) {
        const dx = (mouse.x - m.last.x) / camera.scale;
        const dy = (mouse.y - m.last.y) / camera.scale;
        setCamera({ x: camera.x - dx, y: camera.y - dy });
        m.last = mouse;
      } else if (m.mode === "move" && m.id && m.local) {
        const w = screenToWorld(mouse, camera);
        const node = doc.nodes[m.id!];
        if (!node) return;
        const parentId = node.parentId;
        const off = worldOfAncestors(doc, parentId);
        const nx = Math.round(w.x - off.x - m.local.x);
        const ny = Math.round(w.y - off.y - m.local.y);
        moveNodeTo(m.id!, nx, ny);
      }
    }
    function onUp(e: PointerEvent) {
      drag.current = { mode: null };
      svg.releasePointerCapture(e.pointerId);
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const mouse = getMouse(e);
      const worldBefore = screenToWorld(mouse, camera);
      const zoom = Math.exp(-e.deltaY * 0.001);
      const next = Math.min(8, Math.max(0.125, camera.scale * zoom));
      const tmp = { ...camera, scale: next };
      const worldAfter = screenToWorld(mouse, tmp);
      setCamera({ scale: next, x: camera.x + (worldBefore.x - worldAfter.x), y: camera.y + (worldBefore.y - worldAfter.y) });
    }

    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      svg.removeEventListener("wheel", onWheel);
    };
  }, [doc, camera, engine, setCamera, select, moveNodeTo]);

  // 선택 박스(월드 좌표에서 그리되, 화면상 1px 유지)
  const selectionRect = (() => {
    if (selection.length !== 1) return null;
    const id = selection[0]!;
    const r = engine.worldRectOf(doc, id);
    return (
      <rect x={r.x} y={r.y} width={r.w} height={r.h}
            fill="none" stroke="#3b82f6" strokeDasharray="4 4"
            strokeWidth={1} vectorEffect="non-scaling-stroke" pointerEvents="none" />
    );
  })();

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#fff" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }}>
        {/* 카메라 변환: world -> screen */}
        <g transform={`translate(${-camera.x} ${-camera.y}) scale(${camera.scale})`}>
          <Grid camera={camera} />
          <SvgScene doc={doc} />
          <g>{selectionRect}</g>
        </g>
      </svg>
    </div>
  );
};

const Grid: React.FC<{ camera: Camera }> = ({ camera }) => {
  // 간단한 월드 고정 그리드
  const step = 50;
  const lines: JSX.Element[] = [];
  const span = 10000;
  for (let x = -span; x <= span; x += step) {
    lines.push(<line key={`gx${x}`} x1={x} y1={-span} x2={x} y2={span} stroke="#eee" strokeWidth={1} vectorEffect="non-scaling-stroke" />);
  }
  for (let y = -span; y <= span; y += step) {
    lines.push(<line key={`gy${y}`} x1={-span} y1={y} x2={span} y2={y} stroke="#eee" strokeWidth={1} vectorEffect="non-scaling-stroke" />);
  }
  return <g>{lines}</g>;
};
