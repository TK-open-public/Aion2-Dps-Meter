// hooks/useResizableBase.ts
import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

type StoreKey =
  | "meterWidth"
  | "detailWidth"
  | "detailHeight"
  | "joinPanelWidth"
  | "joinPanelHeight";

interface ResizeAxis {
  key: StoreKey;
  dir: "x" | "y";
  min: number;
  max: number;
}

interface Options {
  axes: ResizeAxis[];
  stopPropagation?: boolean;
  onSave: (state: ReturnType<typeof useSettingsStore.getState>) => void;
}

export const useResizableBase = ({ axes, stopPropagation, onSave }: Options) => {
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startVals = useRef<Partial<Record<StoreKey, number>>>({});
  const rafId = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stopPropagation) e.stopPropagation();
    isResizing.current = true;
    setIsDragging(true);
    startX.current = e.clientX;
    startY.current = e.clientY;
    const state = useSettingsStore.getState();
    axes.forEach(({ key }) => {
      startVals.current[key] = state[key] as number;
    });
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);

      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId.current = requestAnimationFrame(() => {
        const dx = clientX - startX.current;
        const dy = clientY - startY.current;
        const patch: Partial<Record<StoreKey, number>> = {};
        axes.forEach(({ key, dir, min, max }) => {
          const delta = dir === "x" ? dx : dy;
          patch[key] = Math.max(min, Math.min(max, startVals.current[key]! + delta));
        });
        useSettingsStore.setState(patch as any);
      });
    };

    const onMouseUp = () => {
      if (!isResizing.current) return;
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      isResizing.current = false;
      setIsDragging(false);
      onSaveRef.current(useSettingsStore.getState());
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return { onMouseDown, isDragging };
};
