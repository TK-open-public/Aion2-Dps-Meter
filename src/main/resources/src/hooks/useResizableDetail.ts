import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

export const useResizableDetail = () => {
  const { detailHeight, setDetailHeight } = useSettingsStore();
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startY.current = e.clientY;
    startHeight.current = detailHeight;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const dy = e.clientY - startY.current;
      const newH = Math.max(300, Math.min(900, startHeight.current + dy));
      useSettingsStore.setState({ detailHeight: newH });
    };

    const onMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        const { detailHeight } = useSettingsStore.getState();
        setDetailHeight(detailHeight);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return { detailHeight, onMouseDown };
};