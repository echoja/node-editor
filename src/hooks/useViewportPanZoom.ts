import { useEffect, useRef, useState } from "react";
import type { Camera } from "../types";
import { screenToWorld } from "../lib/coords";

type Point = { x: number; y: number };

function isPanGesture(e: PointerEvent, isSpaceHeld: boolean) {
  return (
    e.button === 1 ||
    e.altKey ||
    e.metaKey ||
    e.ctrlKey ||
    (e.button === 0 && isSpaceHeld)
  );
}

export function useViewportPanZoom({
  rootRef,
  camera,
  setCamera,
}: {
  rootRef: React.RefObject<HTMLDivElement>;
  camera: Camera;
  setCamera: (cam: Partial<Camera>) => void;
}) {
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const isSpacePressedRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastMouseRef = useRef<Point | null>(null);

  function getMouse(e: PointerEvent | WheelEvent): Point {
    const r = rootRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  useEffect(() => {
    function isTypingTarget(el: Element | null): boolean {
      if (!el) return false;
      const tag = el.tagName;
      const editable =
        "isContentEditable" in el &&
        (el as HTMLElement).isContentEditable === true;
      return (
        editable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      const isSpace =
        e.code === "Space" || e.key === " " || e.key === "Spacebar";
      if (!isSpace) return;
      if (isTypingTarget(document.activeElement)) return;
      if (!isSpacePressedRef.current) {
        isSpacePressedRef.current = true;
        setIsSpacePressed(true);
      }
      e.preventDefault();
    }
    function onKeyUp(e: KeyboardEvent) {
      const isSpace =
        e.code === "Space" || e.key === " " || e.key === "Spacebar";
      if (!isSpace) return;
      isSpacePressedRef.current = false;
      setIsSpacePressed(false);
    }
    function onBlur() {
      isSpacePressedRef.current = false;
      setIsSpacePressed(false);
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

    function onPointerDown(e: PointerEvent) {
      if (!el) return;
      if (!isPanGesture(e, isSpacePressedRef.current)) return;
      el.setPointerCapture(e.pointerId);
      lastMouseRef.current = getMouse(e);
      setIsPanning(true);
    }

    function onPointerMove(e: PointerEvent) {
      if (!isPanning || !lastMouseRef.current) return;
      const mouse = getMouse(e);
      const dx = (mouse.x - lastMouseRef.current.x) / camera.scale;
      const dy = (mouse.y - lastMouseRef.current.y) / camera.scale;
      setCamera({ x: camera.x - dx, y: camera.y - dy });
      lastMouseRef.current = mouse;
    }

    function onPointerUp(e: PointerEvent) {
      if (!isPanning) return;
      lastMouseRef.current = null;
      setIsPanning(false);
      el.releasePointerCapture(e.pointerId);
    }

    function onWheel(e: WheelEvent) {
      // 기본: 스크롤로 팬. Cmd/Ctrl + 스크롤일 때만 줌.
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) {
        const mouse = getMouse(e);
        const worldBefore = screenToWorld(mouse, camera);
        const zoom = Math.exp(-e.deltaY * 0.001);
        const nextScale = Math.min(8, Math.max(0.125, camera.scale * zoom));
        const tempCamera = { ...camera, scale: nextScale };
        const worldAfter = screenToWorld(mouse, tempCamera);
        setCamera({
          scale: nextScale,
          x: camera.x + (worldBefore.x - worldAfter.x),
          y: camera.y + (worldBefore.y - worldAfter.y),
        });
      } else {
        const dx = e.deltaX / camera.scale;
        const dy = e.deltaY / camera.scale;
        setCamera({ x: camera.x + dx, y: camera.y + dy });
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("wheel", onWheel as any);
    };
  }, [camera, setCamera, isPanning, rootRef]);

  return { isSpacePressed, isPanning } as const;
}
