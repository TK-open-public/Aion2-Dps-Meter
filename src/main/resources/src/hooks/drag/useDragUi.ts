import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const useDragUi = () => {
  const wasDraggingRef = useRef(false);
  const { setUiPosition } = useSettingsStore(
    useShallow((s) => ({ setUiPosition: s.setUiPosition })),
  );

  useEffect(() => {
    const anchor = document.querySelector<HTMLElement>("[data-meter-root-anchor]");
    const rootEl = anchor?.closest<HTMLElement>(".drag-area") ?? null;
    if (!anchor || !rootEl) return;

    let isDragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startUiX = 0;
    let startUiY = 0;
    let currentX = 0;
    let currentY = 0;
    const rafId = { current: null as number | null };

    const handleMouseDown = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement;
      // button, input 등 인터랙티브 요소만 제외
      if (
        target.closest(
          "input, button, .settingsPanel, .detailsPanel, .console, .resizeHandle, .drag-handle, .window-drag-handle",
        )
      )
        return;
      rootEl.style.willChange = "left, top";

      const rect = rootEl.getBoundingClientRect();
      isDragging = true;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startUiX = rect.left;
      startUiY = rect.top;
      currentX = startUiX;
      currentY = startUiY;
    };

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startMouseX;
      const deltaY = e.clientY - startMouseY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        wasDraggingRef.current = true;
      }

      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const panelWidth = rootEl.offsetWidth;
        const panelHeight = rootEl.offsetHeight;
        const nextX = clamp(startUiX + deltaX, 0, window.innerWidth - panelWidth);
        const nextY = clamp(startUiY + deltaY, 0, window.innerHeight - panelHeight);

        currentX = nextX;
        currentY = nextY;
        rootEl.style.left = `${nextX}px`;
        rootEl.style.top = `${nextY}px`;
      });
    };

    const handleMouseUp = () => {
      if (isDragging && wasDraggingRef.current) {
        setUiPosition(currentX, currentY);
      }
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      isDragging = false;
      rootEl.style.willChange = "auto";

      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 0);
    };

    anchor.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      anchor.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setUiPosition]);

  return { wasDraggingRef };
};
