import { create } from "zustand";
import type { Hotkey } from "@/types";
import { parseHotkeyString } from "@/utils/hotKey";
export type DisplayMode =
  | "dps_percent"
  | "amount_dps_percent"
  | "amount_percent"
  | "amount_full_dps_percent"
  | "amount_full_percent";
export type NameDisplay = "all" | "me_only" | "hidden";
export type HeaderPosition = "top" | "bottom";
export type FontFamily =
  | "Spoqa Han Sans Neo"
  | "Freesentation"
  | "Tmoney Round Wind"
  | "Pretendard"
  | "NEXON Lv2 Gothic";

export interface ThemeColors {
  userBar: [string, string];
  normalBar: [string, string];
  warningBar: [string, string];
  errorBar: [string, string];
  bossBar: [string, string];
  serverAColor: string; // 1001~1021
  serverBColor: string; // 2001~2021
  serverDefaultColor: string;
  meterStatAmount: string;
  meterStatDps: string;
  meterStatPercent: string;
  bossRightValue: string;
}

export const DEFAULT_THEME: ThemeColors = {
  userBar: ["#55c42a", "#3a9e20"],
  normalBar: ["#ffc837", "#e8960a"],
  warningBar: ["#ffa537", "#e77808"],
  errorBar: ["#c24343", "#d91717"],
  bossBar: ["#6b0f1a", "#5c1a24"],
  serverAColor: "#95ddff",
  serverBColor: "#f3a5ff",
  serverDefaultColor: "#ffffff",
  meterStatAmount: "#ffe566",
  meterStatDps: "#ffffff",
  meterStatPercent: "#ffe566",
  bossRightValue: "#e63333",
};

interface SettingsState {
  hotkey: Hotkey;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  nameDisplay: NameDisplay;
  setNameDisplay: (mode: NameDisplay) => void;
  fontFamily: FontFamily;
  setFontFamily: (v: FontFamily) => void;
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
  theme: ThemeColors;
  setTheme: (theme: ThemeColors) => void;
  setThemeColor: <K extends keyof ThemeColors>(key: K, value: ThemeColors[K]) => void;
  resetTheme: () => void;
}

const jb = () => (window as any).javaBridge;

const defaultSettings = {
  hotkey: { modifiers: 2, vkCode: 0x52 },
  hideHotkey: { modifiers: 2, vkCode: 0x48 },
  meterWidth: 400,
  rowHeight: 36,
  isDebugMode: false,
  detailHeight: 600,
  displayMode: "dps_percent" as DisplayMode,
  nameDisplay: "all" as NameDisplay,
  fontFamily: "Spoqa Han Sans Neo" as FontFamily,
  headerPosition: "top" as HeaderPosition,
  isMinimal: false,
  theme: DEFAULT_THEME,
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

    const savedThemeRaw = j.loadProps?.("theme");
    let savedTheme: ThemeColors = DEFAULT_THEME;
    try {
      if (savedThemeRaw) savedTheme = { ...DEFAULT_THEME, ...JSON.parse(savedThemeRaw) };
    } catch {}

    set({
      hotkey: parsedHotkey ?? defaultSettings.hotkey,
      hideHotkey: parsedHideHotkey ?? defaultSettings.hideHotkey,
      meterWidth: Number(j.loadProps?.("meterWidth")) || defaultSettings.meterWidth,
      rowHeight: Number(j.loadProps?.("rowHeight")) || defaultSettings.rowHeight,
      detailHeight: Number(j.loadProps?.("detailHeight")) || defaultSettings.detailHeight,
      displayMode: j.loadProps?.("displayMode") ?? defaultSettings.displayMode,
      isDebugMode: j.isDebuggingMode?.() ?? false,
      nameDisplay: j.loadProps?.("nameDisplay") ?? defaultSettings.nameDisplay,
      fontFamily: (j.loadProps?.("fontFamily") as FontFamily) ?? defaultSettings.fontFamily,
      isMinimal: savedIsMinimal,
      headerPosition: j.loadProps?.("headerPosition") ?? defaultSettings.headerPosition,
      theme: savedTheme,
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
    fontFamily: defaultSettings.fontFamily,
    isDebugMode: defaultSettings.isDebugMode,
    headerPosition: defaultSettings.headerPosition,
    theme: defaultSettings.theme,

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
    setFontFamily: (fontFamily) => {
      set({ fontFamily });
      jb()?.saveProps?.("fontFamily", fontFamily);
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
    setTheme: (theme) => {
      set({ theme });
      jb()?.saveProps?.("theme", JSON.stringify(theme));
    },
    setThemeColor: (key, value) =>
      set((s) => {
        const next = { ...s.theme, [key]: value };
        jb()?.saveProps?.("theme", JSON.stringify(next));
        return { theme: next };
      }),
    resetTheme: () => {
      set({ theme: DEFAULT_THEME });
      jb()?.saveProps?.("theme", JSON.stringify(DEFAULT_THEME));
    },
  };
});
