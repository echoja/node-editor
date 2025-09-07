export type NodeID = string;
export type Camera = { x: number; y: number; scale: number };

export type BaseNode = {
  id: NodeID;
  type: "frame" | "rect" | "text";
  parentId: NodeID | null;
  name?: string;
  x: number; // parent-local
  y: number; // parent-local
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type FrameNode = BaseNode & {
  type: "frame";
  w: number;
  h: number;
  clipsContent: boolean;
  background?: string;
  children: NodeID[];
};

export type RectNode = BaseNode & {
  type: "rect";
  w: number;
  h: number;
  radius?: number;
};

export type TextNode = BaseNode & {
  type: "text";
  text: string;
  fontFamily?: string;
  fontSize?: number; // px
  lineHeight?: number;
};

export type Node = FrameNode | RectNode | TextNode;

export type Doc = {
  version: 1;
  rootId: NodeID;
  nodes: Record<string, Node>;
};
