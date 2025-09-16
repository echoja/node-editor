import { useEffect, useRef } from "react";
import type { Camera, NodeID } from "../types";
import { screenToWorld, worldOfAncestors } from "../lib/coords";
import { useEditor } from "../store";
import { useEngine } from "../lib/engineContext";
import { absPreviewWorldRect } from "../lib/drag/preview";
import { computeHoverIndex, parentOf, isRelative } from "../lib/drag/reorder";

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

export function useViewportDnD({
  rootRef,
  camera,
  isSpacePressed,
}: {
  rootRef: React.RefObject<HTMLDivElement>;
  camera: Camera;
  isSpacePressed: boolean;
}) {
  const engine = useEngine();
  const doc = useEditor((s) => s.doc);
  const { setDrag, clearDrag, select, moveNodeTo, reorderRelative } = useEditor(
    (s) => s.actions
  );
  const dragState = useEditor((s) => s.drag);

  const dragStateRef = useRef<{
    mode: "move" | null;
    nodeId?: NodeID;
    localOffset?: Point;
  }>({ mode: null });

  function getMouse(e: PointerEvent | WheelEvent): Point {
    const r = rootRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  useEffect(() => {
    const el = rootRef.current!;
    if (!el) return;

    function onPointerDown(e: PointerEvent) {
      // Let pan gestures be handled by pan/zoom hook
      if (isPanGesture(e, isSpacePressed)) return;

      el.setPointerCapture(e.pointerId);
      const mouse = getMouse(e);
      const hit = engine.hitTest(doc, camera, mouse);
      if (hit) {
        select([hit.id]);
        dragStateRef.current = {
          mode: "move",
          nodeId: hit.id,
          localOffset: hit.local,
        };
        const fromWorld = engine.worldRectOf(doc, hit.id);
        const parent = parentOf(doc, hit.id);
        const isRel = isRelative(doc, hit.id);
        const kind =
          parent && parent.type === "frame" && isRel ? "reorderRel" : "moveAbs";
        setDrag({
          id: hit.id,
          kind,
          parentId: parent?.id ?? null,
          fromWorld,
          local: hit.local,
          previewWorld: null,
          hoverIndex: null,
          activated: false,
          startScreen: mouse,
        });
      } else {
        select([]);
        dragStateRef.current = { mode: null };
      }
    }

    function onPointerMove(e: PointerEvent) {
      const currentDrag = dragStateRef.current;
      if (
        currentDrag.mode !== "move" ||
        !currentDrag.nodeId ||
        !currentDrag.localOffset
      )
        return;
      const mouse = getMouse(e);
      const pointerWorld = screenToWorld(mouse, camera);

      // activate on 1px movement (screen space)
      if (!dragState.activated && dragState.startScreen) {
        const dx = mouse.x - dragState.startScreen.x;
        const dy = mouse.y - dragState.startScreen.y;
        if (Math.hypot(dx, dy) >= 1) {
          setDrag({ activated: true });
        }
      }

      if (
        dragState.kind === "moveAbs" &&
        dragState.fromWorld &&
        dragState.local
      ) {
        const preview = absPreviewWorldRect({
          pointerWorld,
          fromWorld: dragState.fromWorld,
          local: dragState.local,
        });
        setDrag({ previewWorld: preview });
      } else if (dragState.kind === "reorderRel" && dragState.parentId) {
        const preview =
          dragState.fromWorld && dragState.local
            ? absPreviewWorldRect({
                pointerWorld,
                fromWorld: dragState.fromWorld,
                local: dragState.local,
              })
            : null;
        const hoverIndex = computeHoverIndex(
          doc,
          engine,
          dragState.parentId,
          dragState.id!,
          pointerWorld.y
        );
        setDrag({ previewWorld: preview ?? undefined, hoverIndex });
      }
    }

    function onPointerUp(e: PointerEvent) {
      const currentDrag = dragStateRef.current;
      if (
        currentDrag.mode === "move" &&
        currentDrag.nodeId &&
        currentDrag.localOffset
      ) {
        if (dragState.kind === "moveAbs" && dragState.fromWorld) {
          // commit absolute move
          const mouse = getMouse(e);
          const pointerWorld = screenToWorld(mouse, camera);
          const node = doc.nodes[currentDrag.nodeId];
          if (node) {
            const parentId = node.parentId;
            const ancestorWorld = worldOfAncestors(doc, parentId);
            const nextX = Math.round(
              pointerWorld.x - ancestorWorld.x - currentDrag.localOffset.x
            );
            const nextY = Math.round(
              pointerWorld.y - ancestorWorld.y - currentDrag.localOffset.y
            );
            moveNodeTo(currentDrag.nodeId, nextX, nextY);
          }
        } else if (
          dragState.kind === "reorderRel" &&
          dragState.parentId != null &&
          dragState.hoverIndex != null
        ) {
          reorderRelative(
            dragState.parentId,
            currentDrag.nodeId,
            dragState.hoverIndex
          );
        }
      }
      clearDrag();
      dragStateRef.current = { mode: null };
      el.releasePointerCapture(e.pointerId);
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    rootRef,
    camera,
    isSpacePressed,
    doc,
    engine,
    setDrag,
    clearDrag,
    select,
    moveNodeTo,
    reorderRelative,
    dragState.kind,
    dragState.fromWorld,
    dragState.local,
    dragState.parentId,
    dragState.hoverIndex,
    dragState.activated,
    dragState.startScreen,
  ]);
}
