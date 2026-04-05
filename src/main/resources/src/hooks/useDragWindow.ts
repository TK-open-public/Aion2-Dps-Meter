import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect, useRef } from "react";

export const useDragWindow = (selector: string) => {
  const wasDraggingRef = useRef(false);
  const setWindowPosition = useSettingsStore((s) => s.setWindowPosition);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialStageX = 0;
    let initialStageY = 0;

    const handleMouseDown = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement;
      const ignoreTarget = target.closest(
        "input, button, .settingsPanel, .detailsPanel, .console, .resizeHandle",
      );
      if (ignoreTarget) return;

      isDragging = true;
      startX = e.screenX;
      startY = e.screenY;
      initialStageX = window.screenX;
      initialStageY = window.screenY;
    };

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDragging) return;
      if (!(window as any).javaBridge) return;

      const deltaX = e.screenX - startX;
      const deltaY = e.screenY - startY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        wasDraggingRef.current = true;
      }

      (window as any).javaBridge.moveWindow(initialStageX + deltaX, initialStageY + deltaY);
    };

    const handleMouseUp = () => {
      if (isDragging && wasDraggingRef.current) {
        setWindowPosition(window.screenX, window.screenY);
      }

      isDragging = false;
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 0);
    };

    el.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [selector, setWindowPosition]);

  return { wasDraggingRef };
};
