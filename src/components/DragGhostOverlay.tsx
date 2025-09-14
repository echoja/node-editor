import React, { useMemo } from "react";
import { useEditor } from "../store";
import { useEngine } from "../lib/engineContext";
import { worldToScreenRect } from "../lib/layout";
import { applyRelativeReorder } from "../lib/drag/reorder";
import { RELATIVE_GAP } from "../lib/constants";

export const DragGhostOverlay: React.FC = () => {
  const camera = useEditor((s) => s.camera);
  const doc = useEditor((s) => s.doc);
  const drag = useEditor((s) => s.drag);
  const engine = useEngine();

  const wrap: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  };

  const FILL = "rgba(59,130,246,0.12)"; // blue-500 @ 12%
  const BORDER = "#60a5fa"; // blue-400

  const from = useMemo(() => {
    return drag.fromWorld ? worldToScreenRect(camera, drag.fromWorld) : null;
  }, [camera, drag.fromWorld]);
  const preview = useMemo(() => {
    console.log("drag.previewWorld", drag.previewWorld)
    return drag.previewWorld ? worldToScreenRect(camera, drag.previewWorld) : null;
  }, [camera, drag.previewWorld]);

  const siblingsPreview = useMemo(() => {
    if (drag.kind !== "reorderRel" || !drag.parentId || drag.hoverIndex == null) return [] as Array<{x:number;y:number;w:number;h:number;id:string}>;
    const nextChildren = applyRelativeReorder(doc, drag.parentId, drag.id!, drag.hoverIndex);
    if (!nextChildren.length) return [];
    // compute vstack positions for relative children with the next order
    const parent = doc.nodes[drag.parentId];
    if (!parent || parent.type !== "frame") return [];
    const bw = parent.strokeWidth ?? (parent.stroke ? 1 : 0);
    const gap = RELATIVE_GAP;
    const pw = engine.worldRectOf(doc, parent.id);
    let accY = pw.y + (bw || 0);
    const arr: Array<{x:number;y:number;w:number;h:number;id:string}> = [];
    for (const cid of nextChildren) {
      const n = doc.nodes[cid]!;
      if ((n as any).position === "relative") {
        const cw = engine.worldRectOf(doc, cid);
        const rect = { x: pw.x + (bw || 0) + n.x, y: accY, w: cw.w, h: cw.h, id: cid };
        if (cid !== drag.id) arr.push(rect);
        accY += cw.h + gap;
      }
    }
    return arr.map((r) => ({ ...worldToScreenRect(camera, r), id: r.id }));
  }, [camera, doc, engine, drag.kind, drag.parentId, drag.hoverIndex, drag.id]);

  if (!drag.id || !from || !drag.activated) return null;

  return (
    <div style={wrap} aria-label="drag-ghost-overlay">
      {/* original position ghost */}
      <div
        style={{
          position: "absolute",
          left: from.x,
          top: from.y,
          width: from.w,
          height: from.h,
          background: FILL,
          border: `1px dashed ${BORDER}`,
          boxSizing: "border-box",
        }}
      />
      {/* siblings preview (for reorder) */}
      {siblingsPreview.map((r) => (
        <div
          key={`sib-${r.id}`}
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            width: r.w,
            height: r.h,
            border: `1px dashed ${BORDER}`,
            background: "transparent",
            boxSizing: "border-box",
          }}
        />
      ))}
      {/* moving preview ghost */}
      {preview ? (
        <div
          style={{
            position: "absolute",
            left: preview.x,
            top: preview.y,
            width: preview.w,
            height: preview.h,
            background: FILL,
            border: `1px dashed ${BORDER}`,
            boxSizing: "border-box",
          }}
        />
      ) : null}
    </div>
  );
};
