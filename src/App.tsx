import React from "react";
import { Viewport } from "./components/Viewport";
import { useEditor } from "./store";
import { OverlayGroup } from "./components/OverlayGroup";
import { ZoomControls } from "./components/ZoomControls";
import { EngineProvider } from "./lib/engineContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Toolbar } from "@/components/Toolbar";

const Inspector: React.FC = () => {
  const selection = useEditor((s) => s.selection);
  const doc = useEditor((s) => s.doc);
  const { moveNodeTo, togglePosition } = useEditor((s) => s.actions);

  if (selection.length !== 1) {
    return (
      <div className="text-sm text-muted-foreground p-3">Nothing selected</div>
    );
  }
  const id = selection[0]!;
  const n = doc.nodes[id]!;

  return (
    <Card className="m-3">
      <CardHeader className="py-3">
        <CardTitle className="text-base">{n.name ?? n.id}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-2 items-center gap-2">
          <Label>Position</Label>
          <div className="flex items-center gap-2 text-sm">
            <button
              className="px-2 py-1 border rounded hover:bg-accent"
              onClick={() => togglePosition(id!)}
            >
              Toggle (now: {(n.position ?? "absolute")})
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 items-center gap-2">
          <Label htmlFor="pos-x">X</Label>
          <Input
            id="pos-x"
            type="number"
            value={n.x}
            onChange={(e) => moveNodeTo(id!, Number(e.target.value), n.y)}
          />
        </div>
        <div className="grid grid-cols-2 items-center gap-2">
          <Label htmlFor="pos-y">Y</Label>
          <Input
            id="pos-y"
            type="number"
            value={n.y}
            onChange={(e) => moveNodeTo(id!, n.x, Number(e.target.value))}
          />
        </div>
        {"w" in n && "h" in n ? (
          <p className="text-xs text-muted-foreground">
            W/H 편집은 추후 도구에서
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default function App() {
  const { setCamera } = useEditor((s) => s.actions);
  const scale = useEditor((s) => s.camera.scale);
  return (
    <EngineProvider>
      <ResizablePanelGroup direction="horizontal" className="h-screen">
      {/* Left toolbar */}
      <ResizablePanel defaultSize={8} minSize={6} maxSize={16} className="border-r bg-card/30">
        <Toolbar />
      </ResizablePanel>
      <ResizableHandle withHandle />
      {/* Main viewport */}
      <ResizablePanel defaultSize={70} minSize={40} className="relative">
        <div className="absolute inset-0">
          <Viewport />
          <OverlayGroup />
          <ZoomControls />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      {/* Inspector */}
      <ResizablePanel defaultSize={22} minSize={18} className="border-l bg-background">
        <ScrollArea className="h-full">
          <Inspector />
        </ScrollArea>
      </ResizablePanel>
      </ResizablePanelGroup>
    </EngineProvider>
  );
}
