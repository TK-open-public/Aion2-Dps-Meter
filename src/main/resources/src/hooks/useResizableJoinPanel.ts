import { useSettingsStore } from "@/stores/useSettingsStore";
import { useResizableBase } from "./useResizableBase";

export const useResizableJoinPanel = () => {
  const joinPanelHeight = useSettingsStore((s) => s.joinPanelHeight);
  const joinPanelWidth = useSettingsStore((s) => s.joinPanelWidth);

const { onMouseDown: onMouseDownCorner, isDragging } = useResizableBase({
  axes: [
    { key: "joinPanelHeight", dir: "y", min: 200, max: 800 },
    { key: "joinPanelWidth",  dir: "x", min: 280, max: 700 },
  ],
  stopPropagation: true,
  onSave: (s) => {
    // setState는 이미 됐으므로 저장만
    (window as any).javaBridge?.saveProps?.("joinPanelHeight", String(s.joinPanelHeight));
    (window as any).javaBridge?.saveProps?.("joinPanelWidth", String(s.joinPanelWidth));
  },
});


  return { joinPanelHeight, joinPanelWidth, onMouseDownCorner, isDragging };
};
