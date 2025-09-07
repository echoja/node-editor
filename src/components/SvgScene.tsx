import React, { useMemo } from "react";
import type { Doc, FrameNode, Node, RectNode, TextNode } from "../types";

type Props = { doc: Doc };

export const SvgScene: React.FC<Props> = ({ doc }) => {
  const root = doc.nodes[doc.rootId] as FrameNode;
  return (
    <g>
      {root.children.map(id => {
        const child = doc.nodes[id];
        if (!child) return null;
        return <NodeView key={id} doc={doc} node={child} />;
      })}
    </g>
  );
};

const NodeView: React.FC<{ doc: Doc; node: Node }> = ({ doc, node }) => {
  if (node.type === "frame") return <FrameView doc={doc} node={node as FrameNode} />;
  if (node.type === "rect")  return <RectView  node={node as RectNode} />;
  if (node.type === "text")  return <TextView  node={node as TextNode} />;
  return null;
};

const FrameView: React.FC<{ doc: Doc; node: FrameNode }> = ({ doc, node }) => {
  const clipId = useMemo(() => `clip-${node.id}`, [node.id]);
  return (
    <g transform={`translate(${node.x} ${node.y})`} opacity={node.opacity ?? 1}>
      {/* 배경/스트로크 */}
      <rect x={0} y={0} width={node.w} height={node.h}
            fill={node.background ?? "none"}
            stroke={node.stroke ?? "none"}
            strokeWidth={node.strokeWidth ?? 1} />
      {/* 클립 정의 */}
      {node.clipsContent && (
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={node.w} height={node.h} />
          </clipPath>
        </defs>
      )}
      {/* children */}
      <g {...(node.clipsContent ? { clipPath: `url(#${clipId})` } : {})}>
        {node.children.map(id => {
          const child = doc.nodes[id];
          if (!child) return null;
          return <NodeView key={id} doc={doc} node={child} />;
        })}
      </g>
    </g>
  );
};

const RectView: React.FC<{ node: RectNode }> = ({ node }) => {
  const r = Math.max(0, Math.min(node.radius ?? 0, Math.min(node.w, node.h) / 2));
  return (
    <g transform={`translate(${node.x} ${node.y})`} opacity={node.opacity ?? 1}>
      <rect x={0} y={0} width={node.w} height={node.h} rx={r}
            fill={node.fill ?? "none"}
            stroke={node.stroke ?? "none"}
            strokeWidth={node.strokeWidth ?? 1} />
    </g>
  );
};

const TextView: React.FC<{ node: TextNode }> = ({ node }) => {
  const size = node.fontSize ?? 16;
  const family = node.fontFamily ?? "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  return (
    <g transform={`translate(${node.x} ${node.y})`} opacity={node.opacity ?? 1}>
      <text x={0} y={0}
            fontSize={size}
            fontFamily={family}
            dominantBaseline="text-before-edge"
            fill={node.fill ?? "#111"}>
        {node.text}
      </text>
    </g>
  );
};
