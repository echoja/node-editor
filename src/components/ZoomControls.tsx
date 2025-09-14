import React from "react";
import { useEditor } from "../store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

export const ZoomControls: React.FC = () => {
  const { setCamera } = useEditor((s) => s.actions);
  const camera = useEditor((s) => s.camera);

  const onZoomIn = () => setCamera({ scale: camera.scale * 1.2 });
  const onZoomOut = () => setCamera({ scale: camera.scale / 1.2 });
  const onReset = () => setCamera({ scale: 1 });

  return (
    <div className="pointer-events-auto absolute right-2 top-2 flex items-center gap-1 rounded-md border bg-white/90 p-1 shadow-sm">
      <Button size="icon" variant="outline" onClick={onZoomOut} aria-label="Zoom Out">
        <Minus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" onClick={onZoomIn} aria-label="Zoom In">
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" onClick={onReset} aria-label="Reset Zoom">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
