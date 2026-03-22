import { create } from "zustand";
import type { Hotkey } from "@/types";
import { parseHotkeyString } from "@/utils/hotKey";
export type DisplayMode = "dps_percent" | "amount_dps_percent" | "amount_percent";
export type NameDisplay = "all" | "me_only" | "hidden";
export type HeaderPosition = "top" | "bottom";

interface SettingsState {
  hotkey: Hotkey;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  nameDisplay: NameDisplay;
  setNameDisplay: (mode: NameDisplay) => void;
  meterWidth: number;
  setMeterWidth: (w: number) => void;
  rowHeight: number;
  setRowHeight: (h: number) => void;
  detailHeight: number;
  setDetailHeight: (h: number) => void;
  setHotkey: (h: Hotkey) => void;
  isMinimal: boolean;
  hideHotkey: Hotkey;
  setHideHotkey: (h: Hotkey) => void;
  isDebugMode: boolean;
  headerPosition: HeaderPosition;
  setHeaderPosition: (v: HeaderPosition) => void;

  setIsMinimal: (v: boolean) => void;
  toggleMinimal: () => void;
}

const jb = () => (window as any).javaBridge;

const defaultSettings = {
  hotkey: { modifiers: 2, vkCode: 0x52 },
  hideHotkey: { modifiers: 2, vkCode: 0x48 },
  meterWidth: 400,
  rowHeight: 40,
  isDebugMode: false,
  detailHeight: 600,
  displayMode: "dps_percent" as DisplayMode,
  nameDisplay: "all" as NameDisplay,
  headerPosition: "top" as HeaderPosition,

  isMinimal: false,
};

export const useSettingsStore = create<SettingsState>((set) => {
  const interval = setInterval(() => {
    const j = jb();
    if (!j || typeof j.loadProps !== "function") return;

    const raw = j.getHotkey?.();
    const rawHide = j.getHideHotkey?.();
    const parsedHotkey = raw ? parseHotkeyString(raw) : null;
    const parsedHideHotkey = rawHide ? parseHotkeyString(rawHide) : null;
    const savedIsMinimal = j.loadProps("isMinimal") === "true";

    set({
      hotkey: parsedHotkey ?? defaultSettings.hotkey,
      hideHotkey: parsedHideHotkey ?? defaultSettings.hideHotkey,
      meterWidth: Number(j.loadProps?.("meterWidth")) || defaultSettings.meterWidth,
      rowHeight: Number(j.loadProps?.("rowHeight")) || defaultSettings.rowHeight,
      detailHeight: Number(j.loadProps?.("detailHeight")) || defaultSettings.detailHeight,
      displayMode: j.loadProps?.("displayMode") ?? defaultSettings.displayMode,
      isDebugMode: j.isDebuggingMode?.() ?? false,
      nameDisplay: j.loadProps?.("nameDisplay") ?? defaultSettings.nameDisplay,
      isMinimal: savedIsMinimal,
      headerPosition: j.loadProps?.("headerPosition") ?? defaultSettings.headerPosition,
    });
    clearInterval(interval);
  }, 300);

  return {
    hotkey: defaultSettings.hotkey,
    hideHotkey: defaultSettings.hideHotkey,
    isMinimal: defaultSettings.isMinimal,
    meterWidth: defaultSettings.meterWidth,
    rowHeight: defaultSettings.rowHeight,
    detailHeight: defaultSettings.detailHeight,
    displayMode: defaultSettings.displayMode,
    nameDisplay: defaultSettings.nameDisplay,
    isDebugMode: defaultSettings.isDebugMode,
    headerPosition: defaultSettings.headerPosition,

    setHotkey: (hotkey) => {
      set({ hotkey });
      jb()?.updateHotkey?.(hotkey.modifiers, hotkey.vkCode);
    },
    setHideHotkey: (hideHotkey) => {
      set({ hideHotkey });
      jb()?.updateHideHotkey?.(hideHotkey.modifiers, hideHotkey.vkCode);
    },
    setIsMinimal: (isMinimal) => {
      set({ isMinimal });
      jb()?.saveProps?.("isMinimal", String(isMinimal));
    },
    toggleMinimal: () =>
      set((s) => {
        const next = !s.isMinimal;
        jb()?.saveProps?.("isMinimal", String(next));
        return { isMinimal: next };
      }),
    setDisplayMode: (displayMode) => {
      set({ displayMode });
      jb()?.saveProps?.("displayMode", displayMode);
    },
    setNameDisplay: (nameDisplay) => {
      set({ nameDisplay });
      jb()?.saveProps?.("nameDisplay", nameDisplay);
    },
    setMeterWidth: (meterWidth) => {
      set({ meterWidth });
      jb()?.saveProps?.("meterWidth", meterWidth);
    },
    setRowHeight: (rowHeight) => {
      set({ rowHeight });
      jb()?.saveProps?.("rowHeight", rowHeight);
    },
    setDetailHeight: (detailHeight) => {
      set({ detailHeight });
      jb()?.saveProps?.("detailHeight", detailHeight);
    },
    setHeaderPosition: (headerPosition) => {
      set({ headerPosition });
      jb()?.saveProps?.("headerPosition", headerPosition);
    },
  };
});
