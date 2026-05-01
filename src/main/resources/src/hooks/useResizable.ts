import { useSettingsStore } from "@/stores/useSettingsStore";
import { useResizableBase } from "./useResizableBase";

export const useResizable = () => {
  const meterWidth = useSettingsStore((s) => s.meterWidth);

  const { onMouseDown, isDragging } = useResizableBase({
    axes: [{ key: "meterWidth", dir: "x", min: 240, max: 800 }],
    onSave: (s) => {
      (window as any).javaBridge?.saveProps?.("meterWidth", String(s.meterWidth));
    },
  });

  return { meterWidth, onMouseDown, isDragging };
};
