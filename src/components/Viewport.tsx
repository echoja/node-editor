import React, { useEffect, useMemo, useRef } from "react";
import { useEditor } from "../store";
import { pureEngine } from "../engine/pure";
import type { EnginePort } from "../engine/port";
import { DivScene } from "./DivScene";
import type { Doc, NodeID, Camera } from "../types";

export const Viewport: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
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
    const r = rootRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function worldOfAncestors(d: Doc, parentId: NodeID | null) {
    let x = 0, y = 0;
    let cur = parentId ? d.nodes[parentId] : null;
    while (cur) { x += cur.x; y += cur.y; cur = cur.parentId ? d.nodes[cur.parentId] : null; }
    return { x, y };
  }

  useEffect(() => {
    const el = rootRef.current!;
    function onDown(e: PointerEvent) {
      el.setPointerCapture(e.pointerId);
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
      el.releasePointerCapture(e.pointerId);
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

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [doc, camera, engine, setCamera, select, moveNodeTo]);

  // 선택 박스: 화면 좌표에서 1px 유지
  const selectionRect = (() => {
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
  })();

  const worldStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transform: `translate(${-camera.x}px, ${-camera.y}px) scale(${camera.scale})`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", height: "100%", background: "#fff", overflow: "hidden" }}>
      {/* 월드 레이어 (카메라 변환 적용) */}
      <div style={worldStyle}>
        <Grid />
        <DivScene doc={doc} />
      </div>
      {/* 선택 박스 오버레이 (화면 고정 레이어) */}
      {selectionRect}
    </div>
  );
};

const Grid: React.FC = () => {
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
