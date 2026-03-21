import { useEffect, useState } from "react";

const MOD_CTRL = 0x0002;
const MOD_ALT = 0x0001;
const MODIFIER_VKS = new Set([16, 17, 18, 91, 92]);

export const useHotkeyCapture = (initialHotkey: any) => {
  const [pending, setPending] = useState(initialHotkey);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isCapturing) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.shiftKey || e.metaKey) return;
      if (!(e.ctrlKey || e.altKey)) return;
      if (MODIFIER_VKS.has(e.keyCode)) return;

      e.preventDefault();
      const mods = (e.ctrlKey ? MOD_CTRL : 0) | (e.altKey ? MOD_ALT : 0);
      setPending({ modifiers: mods, vkCode: e.keyCode });
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isCapturing]);
  return {
    pending,
    isCapturing,
    start: () => setIsCapturing(true),
    stop: () => setIsCapturing(false),
    reset: (hotkey: any) => setPending(hotkey),
  };
};
