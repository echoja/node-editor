import React from "react";
import type { Doc, FrameNode, Node, RectNode, TextNode } from "../types";
import { localRectOf } from "../lib/layout";
import { useEngine } from "../lib/engineContext";

type Props = { doc: Doc };

export const DivScene: React.FC<Props> = ({ doc }) => {
  const engine = useEngine();
  const root = doc.nodes[doc.rootId];
  if (!root || root.type !== "frame") return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      {root.children.map((id) => {
        const child = doc.nodes[id];
        if (!child) return null;
        return <NodeView key={id} doc={doc} node={child} />;
      })}
    </div>
  );
};

const NodeView: React.FC<{ doc: Doc; node: Node }> = ({ doc, node }) => {
  const engine = useEngine();
  if (node.type === "frame") return <FrameView doc={doc} node={node} />;
  if (node.type === "rect") return <RectView node={node} doc={doc} />;
  if (node.type === "text") return <TextView node={node} doc={doc} />;
  return null;
};

const FrameView: React.FC<{ doc: Doc; node: FrameNode }> = ({ doc, node }) => {
  const engine = useEngine();
  const borderWidth = node.strokeWidth ?? (node.stroke ? 1 : 0);
  const style: React.CSSProperties = {
    position: "absolute",
    left: localRectOf(engine, doc, node.id).x,
    top: localRectOf(engine, doc, node.id).y,
    width: node.w,
    height: node.h,
    background: node.background ?? "transparent",
    borderStyle: node.stroke ? "solid" : "none",
    borderColor: node.stroke ?? "transparent",
    borderWidth,
    opacity: node.opacity ?? 1,
    overflow: node.clipsContent ? "hidden" : "visible",
    boxSizing: "border-box",
  };
  return (
    <div style={style}>
      {node.children.map((id) => {
        const child = doc.nodes[id];
        if (!child) return null;
        return <NodeView key={id} doc={doc} node={child} />;
      })}
    </div>
  );
};

const RectView: React.FC<{ node: RectNode; doc: Doc }> = ({ node, doc }) => {
  const engine = useEngine();
  const r = Math.max(0, Math.min(node.radius ?? 0, Math.min(node.w, node.h) / 2));
  const borderWidth = node.strokeWidth ?? (node.stroke ? 1 : 0);
  const style: React.CSSProperties = {
    position: "absolute",
    left: localRectOf(engine, doc, node.id).x,
    top: localRectOf(engine, doc, node.id).y,
    width: node.w,
    height: node.h,
    background: node.fill ?? "transparent",
    borderStyle: node.stroke ? "solid" : "none",
    borderColor: node.stroke ?? "transparent",
    borderWidth,
    borderRadius: r,
    opacity: node.opacity ?? 1,
    boxSizing: "border-box",
  };
  return <div style={style} />;
};

const TextView: React.FC<{ node: TextNode; doc: Doc }> = ({ node, doc }) => {
  const engine = useEngine();
  const size = node.fontSize ?? 16;
  const family =
    node.fontFamily ?? "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  const style: React.CSSProperties = {
    position: "absolute",
    left: localRectOf(engine, doc, node.id).x,
    top: localRectOf(engine, doc, node.id).y,
    color: node.fill ?? "#111",
    fontSize: size,
    fontFamily: family,
    lineHeight: 1,
    whiteSpace: "pre",
    opacity: node.opacity ?? 1,
  };
  return <div style={style}>{node.text}</div>;
};
