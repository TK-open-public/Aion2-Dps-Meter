import { useEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

export const FontApplier = () => {
  const fontFamily = useSettingsStore((s) => s.fontFamily);

  useEffect(() => {
    document.body.style.fontFamily = `"${fontFamily}"`;
  }, [fontFamily]);

  return null;
};

