import { useSettingsStore } from "@/stores/useSettingsStore";
import { useResizableBase } from "./useResizableBase";

export const useResizableDetail = () => {
  const detailHeight = useSettingsStore((s) => s.detailHeight);
  const detailWidth = useSettingsStore((s) => s.detailWidth);

  const { onMouseDown: onMouseDownCorner } = useResizableBase({
    axes: [
      { key: "detailHeight", dir: "y", min: 300, max: 1070 },
      { key: "detailWidth", dir: "x", min: 480, max: 1600 },
    ],
    onSave: (s) => {
      (window as any).javaBridge?.saveProps?.("detailHeight", String(s.detailHeight));
      (window as any).javaBridge?.saveProps?.("detailWidth", String(s.detailWidth));
    },
  });

  return { detailHeight, detailWidth, onMouseDownCorner };
};
