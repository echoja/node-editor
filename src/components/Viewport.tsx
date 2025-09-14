import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEditor } from "../store";
import { useEngine } from "../lib/engineContext";
import { DivScene } from "./DivScene";
import { ViewportGrid } from "./ViewportGrid";
import { screenToWorld, worldOfAncestors } from "./coords";
import type { Doc, NodeID, Camera } from "../types";
import { absPreviewWorldRect } from "../lib/drag/preview";
import { computeHoverIndex, parentOf, isRelative } from "../lib/drag/reorder";

export const Viewport: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const engine = useEngine();
  const doc = useEditor((s) => s.doc);
  const camera = useEditor((s) => s.camera);
  const selection = useEditor((s) => s.selection);
  const { setCamera, select, moveNodeTo, setDrag, clearDrag, reorderRelative } = useEditor((s) => s.actions);
  const dragStore = useEditor((s) => s.drag);

  const drag = useRef<{
    mode: "pan" | "move" | null;
    id?: NodeID;
    local?: { x: number; y: number };
    last?: { x: number; y: number };
  }>({ mode: null });
  const [spaceDown, setSpaceDown] = useState(false);
  const spaceRef = useRef(false);

  function getMouse(e: PointerEvent | WheelEvent) {
    const r = rootRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  useEffect(() => {
    function isTypingTarget(el: Element | null): boolean {
      if (!el) return false;
      const tag = el.tagName;
      const editable =
        "isContentEditable" in el && el.isContentEditable === true;
      return (
        editable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      // Space 핸드 툴 (타이핑 중에는 비활성)
      const isSpace =
        e.code === "Space" || e.key === " " || e.key === "Spacebar";
      if (!isSpace) return;
      if (isTypingTarget(document.activeElement)) return;
      if (!spaceRef.current) {
        spaceRef.current = true;
        setSpaceDown(true);
      }
      // 페이지 스크롤 방지
      e.preventDefault();
    }
    function onKeyUp(e: KeyboardEvent) {
      const isSpace =
        e.code === "Space" || e.key === " " || e.key === "Spacebar";
      if (!isSpace) return;
      spaceRef.current = false;
      setSpaceDown(false);
    }
    function onBlur() {
      // 창 포커스가 사라지면 상태 정리
      spaceRef.current = false;
      setSpaceDown(false);
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current!;
    function onDown(e: PointerEvent) {
      el.setPointerCapture(e.pointerId);
      const mouse = getMouse(e);
      const isPan =
        e.button === 1 ||
        e.altKey ||
        e.metaKey ||
        e.ctrlKey ||
        (e.button === 0 && spaceRef.current);
      if (isPan) {
        drag.current = { mode: "pan", last: mouse };
      } else {
        const hit = engine.hitTest(doc, camera, mouse);
        if (hit) {
          select([hit.id]);
          drag.current = { mode: "move", id: hit.id, local: hit.local };
          const fromWorld = engine.worldRectOf(doc, hit.id);
          const parent = parentOf(doc, hit.id);
          const isRel = isRelative(doc, hit.id);
          const kind = parent && parent.type === "frame" && isRel ? "reorderRel" : "moveAbs";
          setDrag({ id: hit.id, kind, parentId: parent?.id ?? null, fromWorld, local: hit.local, previewWorld: null, hoverIndex: null, activated: false, startScreen: mouse });
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
        // activate on 1px movement (screen space)
        if (!dragStore.activated && dragStore.startScreen) {
          const dx = mouse.x - dragStore.startScreen.x;
          const dy = mouse.y - dragStore.startScreen.y;
          if (Math.hypot(dx, dy) >= 1) {
            setDrag({ activated: true });
          }
        }
        // preview only; don't mutate doc
        if (dragStore.kind === "moveAbs" && dragStore.fromWorld && dragStore.local) {
          const preview = absPreviewWorldRect(w, dragStore.fromWorld, dragStore.local);
          setDrag({ previewWorld: preview });
        } else if (dragStore.kind === "reorderRel" && dragStore.parentId) {
          const preview = dragStore.fromWorld && dragStore.local ? absPreviewWorldRect(w, dragStore.fromWorld, dragStore.local) : null;
          const hover = computeHoverIndex(doc, engine, dragStore.parentId, dragStore.id!, w.y);
          setDrag({ previewWorld: preview ?? undefined, hoverIndex: hover });
        }
      }
    }
    function onUp(e: PointerEvent) {
      const m = drag.current;
      if (m.mode === "move" && m.id && m.local) {
        if (dragStore.kind === "moveAbs" && dragStore.fromWorld) {
          // commit absolute move
          const mouse = getMouse(e);
          const w = screenToWorld(mouse, camera);
          const node = doc.nodes[m.id!];
          if (node) {
            const parentId = node.parentId;
            const off = worldOfAncestors(doc, parentId);
            const nx = Math.round(w.x - off.x - m.local.x);
            const ny = Math.round(w.y - off.y - m.local.y);
            moveNodeTo(m.id!, nx, ny);
          }
        } else if (dragStore.kind === "reorderRel" && dragStore.parentId != null && dragStore.hoverIndex != null) {
          reorderRelative(dragStore.parentId, m.id!, dragStore.hoverIndex);
        }
      }
      clearDrag();
      drag.current = { mode: null };
      el.releasePointerCapture(e.pointerId);
    }
    function onWheel(e: WheelEvent) {
      // 기본: 스크롤로 팬. Cmd(또는 Ctrl)+스크롤일 때만 줌.
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) {
        const mouse = getMouse(e);
        const worldBefore = screenToWorld(mouse, camera);
        const zoom = Math.exp(-e.deltaY * 0.001);
        const next = Math.min(8, Math.max(0.125, camera.scale * zoom));
        const tmp = { ...camera, scale: next };
        const worldAfter = screenToWorld(mouse, tmp);
        setCamera({
          scale: next,
          x: camera.x + (worldBefore.x - worldAfter.x),
          y: camera.y + (worldBefore.y - worldAfter.y),
        });
      } else {
        const dx = e.deltaX / camera.scale;
        const dy = e.deltaY / camera.scale;
        setCamera({ x: camera.x + dx, y: camera.y + dy });
      }
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
  }, [doc, camera, engine, setCamera, select, moveNodeTo, setDrag, clearDrag, reorderRelative, dragStore.kind, dragStore.fromWorld, dragStore.local, dragStore.parentId, dragStore.hoverIndex, dragStore.activated, dragStore.startScreen]);

  // 선택 박스는 별도 오버레이 컴포넌트에서 렌더링

  const worldStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transform: `translate(${-camera.x * camera.scale}px, ${-camera.y * camera.scale}px) scale(${
      camera.scale
    })`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  const zoomAt = useCallback(
    (factor: number) => {
      const el = rootRef.current;
      if (!el) {
        console.error("no root");
        return;
      }
      const r = el.getBoundingClientRect();
      const mouse = { x: r.width / 2, y: r.height / 2 };
      const worldBefore = screenToWorld(mouse, camera);
      const next = Math.min(8, Math.max(0.125, camera.scale * factor));
      const tmp = { ...camera, scale: next };
      const worldAfter = screenToWorld(mouse, tmp);
      console.log("ho1");
      setCamera({
        scale: next,
        x: camera.x + (worldBefore.x - worldAfter.x),
        y: camera.y + (worldBefore.y - worldAfter.y),
      });
    },
    [camera, setCamera]
  );

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
        cursor:
          drag.current.mode === "pan"
            ? "grabbing"
            : spaceDown
            ? "grab"
            : "default",
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
