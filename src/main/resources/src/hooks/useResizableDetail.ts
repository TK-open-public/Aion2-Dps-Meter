import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

type Direction = "both";

export const useResizableDetail = () => {
  const { detailHeight, setDetailHeight, detailWidth, setDetailWidth } = useSettingsStore();
  const isResizing = useRef<Direction | null>(null);
  const startY = useRef(0);
  const startX = useRef(0);
  const startHeight = useRef(0);
  const startWidth = useRef(0);

  const onMouseDownCorner = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = "both";
    startY.current = e.clientY;
    startX.current = e.clientX;
    startHeight.current = detailHeight;
    startWidth.current = detailWidth;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      if (isResizing.current === "both") {
        const dy = e.clientY - startY.current;
        const dx = e.clientX - startX.current;
        const newH = Math.max(300, Math.min(1070, startHeight.current + dy));
        const newW = Math.max(480, Math.min(1600, startWidth.current + dx));
        useSettingsStore.setState({ detailHeight: newH, detailWidth: newW });
      }
    };

    const onMouseUp = () => {
      if (!isResizing.current) return;
      const { detailHeight, detailWidth } = useSettingsStore.getState();
      setDetailHeight(detailHeight);
      setDetailWidth(detailWidth);
      isResizing.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return { detailHeight, detailWidth ,onMouseDownCorner };
};
