import { create } from "zustand";
import type { Hotkey } from "@/types";

export type DisplayMode = "dps_percent" | "amount_dps_percent" | "amount_percent";
export type NameDisplay = "all" | "me_only" | "hidden";

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
}

const jb = () => (window as any).javaBridge;

const defaultSettings = {
  hotkey: { modifiers: 2, vkCode: 0x52 },
  meterWidth: 400,
  rowHeight: 40,
  detailHeight: 600,

  displayMode: "dps_percent" as DisplayMode,
  nameDisplay: "all" as NameDisplay,
};

export const useSettingsStore = create<SettingsState>((set) => {
  const saved = jb()?.getSettings?.();

  return {
    hotkey: saved?.hotkey ?? defaultSettings.hotkey,
    meterWidth: saved?.meterWidth ?? defaultSettings.meterWidth,
    rowHeight: saved?.rowHeight ?? defaultSettings.rowHeight,
    displayMode: saved?.displayMode ?? defaultSettings.displayMode,
    nameDisplay: saved?.nameDisplay ?? defaultSettings.nameDisplay,
    detailHeight: saved?.detailHeight ?? defaultSettings.detailHeight,

    setHotkey: (hotkey) => {
      set({ hotkey });
      jb()?.saveSetting?.("hotkey", hotkey);
    },
    setDisplayMode: (displayMode) => {
      set({ displayMode });
      jb()?.saveSetting?.("displayMode", displayMode);
    },
    setNameDisplay: (nameDisplay) => {
      set({ nameDisplay });
      jb()?.saveSetting?.("nameDisplay", nameDisplay);
    },
    setMeterWidth: (meterWidth) => {
      set({ meterWidth });
      jb()?.saveSetting?.("meterWidth", meterWidth);
    },
    setRowHeight: (rowHeight) => {
      set({ rowHeight });
      jb()?.saveSetting?.("rowHeight", rowHeight);
    },

    setDetailHeight: (detailHeight) => {
      set({ detailHeight });
      jb()?.saveSetting?.("detailHeight", { detailHeight });
    },
  };
});
