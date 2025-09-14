import React from "react";
import { Viewport } from "./components/Viewport";
import { useEditor } from "./store";
import { SelectionOverlay } from "./components/SelectionOverlay";
import { ResizeHandlesOverlay } from "./components/ResizeHandlesOverlay";
import { ZoomControls } from "./components/ZoomControls";
import { DebugOverlay } from "./components/DebugOverlay";
import { OverlayGroup } from "./components/OverlayGroup";

const Inspector: React.FC = () => {
  const selection = useEditor(s => s.selection);
  const doc = useEditor(s => s.doc);
  const { moveNodeTo } = useEditor(s => s.actions);
  if (selection.length !== 1) return <div style={{ padding: 12, color: "#666" }}>Nothing selected</div>;
  const id = selection[0]!; const n = doc.nodes[id]!;
  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{n.name ?? n.id}</div>
      <label>X <input type="number" value={n.x} onChange={e => moveNodeTo(id!, Number(e.target.value), n.y)} /></label>
      <label style={{ marginLeft: 8 }}>Y <input type="number" value={n.y} onChange={e => moveNodeTo(id!, n.x, Number(e.target.value))} /></label>
      {"w" in n && "h" in n ? <div style={{ marginTop: 8, color: "#666" }}>W/H 편집은 추후 도구에서</div> : null}
    </div>
  );
};

export default function App() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 260px", height: "100vh" }}>
      <aside style={{ borderRight: "1px solid #eee", padding: 8 }}>툴바</aside>
      <main style={{ position: "relative", }}>
        <Viewport />
        <OverlayGroup />
      </main>
      <aside style={{ borderLeft: "1px solid #eee" }}><Inspector /></aside>
    </div>
  );
}
