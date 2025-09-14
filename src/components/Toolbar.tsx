import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEditor } from "@/store";
import { Frame, MousePointer2, Square, Type, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export const Toolbar: React.FC = () => {
  const { setCamera } = useEditor((s) => s.actions);
  const scale = useEditor((s) => s.camera.scale);

  return (
    <div className="p-2 flex flex-col items-stretch gap-2 " aria-label="toolbar">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="icon" aria-label="Rectangle Tool">
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Text Tool">
          <Type className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Frame Tool">
          <Frame className="h-4 w-4" />
        </Button>
      </div>
      <Separator className="my-1" />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCamera({ scale: scale * 1.2 })}
          aria-label="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCamera({ scale: scale / 1.2 })}
          aria-label="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCamera({ scale: 1 })}
          aria-label="Reset Zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;

