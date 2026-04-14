import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useHotkeyCapture } from "@/hooks/useHotkeyCapture";
import { formatHotkey } from "@/utils/hotKey";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  DisplayMode,
  FontFamily,
  HeaderPosition,
  NameDisplay,
  ThemeColors,
} from "@/stores/useSettingsStore";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SettingsItem } from "./SettingsItem";
import { SettingsRow } from "./SettingsRow";
import { SettingsControlInput } from "./SettingsControlInput";
import { ColorSwatch, GradientRow } from "@/components/colorpicker";
import type { UpdateInfo } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  onClose: () => void;
  onReady?: () => void;
  currentVersion?: string;
  updateInfo?: UpdateInfo | null;
  onCheckUpdate?: () => void;
}

const DISPLAY_MODES: { value: DisplayMode; label: string; description: string }[] = [
  { value: "dps_percent", label: "DPS / 贡献度", description: "45,000/秒 (35.5%)" },
  {
    value: "amount_dps_percent",
    label: "累计(缩略) / DPS / 贡献度",
    description: "1.2M 45,000/秒 (35.5%)",
  },
  { value: "amount_percent", label: "累计(缩略) / 贡献度", description: "1.2M (35.5%)" },
  {
    value: "amount_full_dps_percent",
    label: "累计(全部) / DPS / 贡献度",
    description: "1,234,567 45,000/秒 (35.5%)",
  },
  { value: "amount_full_percent", label: "累计(全部) / 贡献度", description: "1,234,567 (35.5%)" },
];

const NAME_DISPLAY_MODES: { value: NameDisplay; label: string }[] = [
  { value: "all", label: "全部显示" },
  { value: "me_only", label: "只显示我" },
  { value: "hidden", label: "全部隐藏" },
];

const FONT_FAMILIES: { value: FontFamily; label: string }[] = [
  { value: "Spoqa Han Sans Neo", label: "Spoqa Han Sans Neo" },
  { value: "Freesentation", label: "Freesentation" },
  { value: "Tmoney Round Wind", label: "Tmoney Round Wind" },
  { value: "Pretendard", label: "Pretendard" },
  { value: "NEXON Lv2 Gothic", label: "NEXON Lv2 Gothic" },
];

export const SettingsPanel = ({
  onClose,
  onReady,
  currentVersion,
  updateInfo,
  onCheckUpdate,
}: Props) => {
  const { t } = useTranslation();
  const {
    hotkey,
    setHotkey,
    hideHotkey,
    setHideHotkey,
    displayMode,
    setDisplayMode,
    nameDisplay,
    setNameDisplay,
    fontFamily,
    setFontFamily,
    rowHeight,
    setRowHeight,
    isMinimal,
    setIsMinimal,
    headerPosition,
    setHeaderPosition,
    theme,
    setThemeColor,
    setTheme,
    resetTheme,
    showCombatTimerInMinimal,
    setShowCombatTimerInMinimal,
    showTargetInfoInMinimal,
    setShowTargetInfoInMinimal,
    // showPower,
    // setShowPower,
  } = useSettingsStore();

  const { pending, start, stop, reset } = useHotkeyCapture(hotkey);
  const {
    pending: pendingHide,
    start: startHide,
    stop: stopHide,
    reset: resetHide,
  } = useHotkeyCapture(hideHotkey);

  const [snapshot] = useState(() => ({
    hotkey,
    hideHotkey,
    displayMode,
    headerPosition,
    nameDisplay,
    fontFamily,
    rowHeight,
    isMinimal,
    showCombatTimerInMinimal,
    showTargetInfoInMinimal,

    theme: { ...theme },
  }));

  useEffect(() => {
    onReady?.();
  }, []);

  const handleChange = (
    partial: Partial<{ displayMode: DisplayMode; nameDisplay: NameDisplay; rowHeight: number }>,
  ) => {
    if (partial.displayMode !== undefined) setDisplayMode(partial.displayMode);
    if (partial.nameDisplay !== undefined) setNameDisplay(partial.nameDisplay);
    if (partial.rowHeight !== undefined) setRowHeight(partial.rowHeight);
  };

  const handleSave = () => {
    setHotkey(pending);
    setHideHotkey(pendingHide);
    onClose();
  };

  const handleCancel = () => {
    setDisplayMode(snapshot.displayMode);
    setNameDisplay(snapshot.nameDisplay);
    setFontFamily(snapshot.fontFamily);
    setRowHeight(snapshot.rowHeight);
    setIsMinimal(snapshot.isMinimal);
    setShowCombatTimerInMinimal(snapshot.showCombatTimerInMinimal);
    setShowTargetInfoInMinimal(snapshot.showTargetInfoInMinimal);
    setHotkey(snapshot.hotkey);
    reset(snapshot.hotkey);
    resetHide(snapshot.hideHotkey);
    setHeaderPosition(snapshot.headerPosition);
    setTheme(snapshot.theme as ThemeColors);

    onClose();
  };

  return (
    <div className="font-bold relative rounded-lg py-3 px-7 w-100">
      <div className="flex items-center pb-3 border-b border-white/10">
        <span>设置</span>
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={handleCancel}>
          <X className="scale-125" />
        </Button>
      </div>

      <div className="max-h-170 py-2 -mr-4 pr-4 overflow-y-auto">
        <SettingsItem>
          <SettingsRow
            title="版本信息"
            description={currentVersion ? `v${currentVersion}` : "-"}
            rightClassName="flex items-center">
            <Button
              onClick={onCheckUpdate}
              variant="ghost"
              size="lg"
              className={
                updateInfo
                  ? " py-3 transition-all text-green-400 border border-green-400/30 hover:bg-green-400/10"
                  : " py-3 transition-all opacity-60 hover:opacity-100"
              }>
              {updateInfo ? `v${updateInfo.latestVersion} 更新` : "检查更新"}
            </Button>
          </SettingsRow>
        </SettingsItem>

        <SettingsItem>
          <SettingsRow
            title="字体"
            description="选择显示字体"
            align="center"
            rightClassName="w-44">
            <Select
              value={fontFamily}
              onValueChange={(v) => setFontFamily(v as FontFamily)}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map(({ value, label }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="px-4 py-2">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsItem>

        <SettingsItem>
          <SettingsRow
            title="按钮位置"
            description="设置头部按钮的位置">
            <Select
              value={headerPosition}
              onValueChange={(v) => setHeaderPosition(v as HeaderPosition)}>
              <SelectTrigger className="w-24 bg-white/5 border-white/10 ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="top"
                  className="px-4 py-2">
                  顶部
                </SelectItem>
                <SelectItem
                  value="bottom"
                  className="px-4 py-2">
                  底部
                </SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsItem>

        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">快捷键设置</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem>
          <SettingsRow
            title="刷新"
            align="center"
            rightClassName="w-44">
            <SettingsControlInput
              readOnly
              onFocus={start}
              onBlur={stop}
              value={formatHotkey(pending.modifiers, pending.vkCode)}
              className="cursor-pointer"
            />
          </SettingsRow>

          <SettingsRow
            title="最小化"
            align="center"
            rightClassName="w-44">
            <SettingsControlInput
              readOnly
              onFocus={startHide}
              onBlur={stopHide}
              value={formatHotkey(pendingHide.modifiers, pendingHide.vkCode)}
              className="cursor-pointer"
            />
          </SettingsRow>
        </SettingsItem>

        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">紧凑模式</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem>
          <SettingsRow title="紧凑模式">
            <Switch
              checked={isMinimal}
              onCheckedChange={(v) => setIsMinimal(v)}
              className="data-[state=checked]:bg-purple-500"
            />
          </SettingsRow>

          <SettingsRow title="紧凑模式时显示战斗时间">
            <Switch
              checked={showCombatTimerInMinimal}
              onCheckedChange={(v) => setShowCombatTimerInMinimal(v)}
              className="data-[state=checked]:bg-purple-500 disabled:opacity-30"
            />
          </SettingsRow>

          <SettingsRow title="紧凑模式时显示BOSS">
            <Switch
              checked={showTargetInfoInMinimal}
              onCheckedChange={(v) => setShowTargetInfoInMinimal(v)}
              className="data-[state=checked]:bg-purple-500 disabled:opacity-30"
            />
          </SettingsRow>
        </SettingsItem>

        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">Meter设置</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        {/* <SettingsRow
          title="战斗力显示"
          description="在名称旁边显示战斗力">
          <Switch
            checked={showPower}
            onCheckedChange={(v) => setShowPower(v)}
            className="data-[state=checked]:bg-purple-500"
          />
        </SettingsRow> */}
        <SettingsItem>
          <SettingsRow
            title="显示格式"
            align="center"
            rightClassName="w-44">
            <Select
              value={displayMode}
              onValueChange={(v) => handleChange({ displayMode: v as DisplayMode })}>
              <SelectTrigger className="text-xs w-44 bg-white/5 border-white/10 ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_MODES.map(({ value, label }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="px-4 py-2">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            title="ID显示"
            align="center"
            rightClassName="w-44">
            <Select
              value={nameDisplay}
              onValueChange={(v) => handleChange({ nameDisplay: v as NameDisplay })}>
              <SelectTrigger className="text-xs w-44 bg-white/5 border-white/10 ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NAME_DISPLAY_MODES.map(({ value, label }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="px-4 py-2">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            title="行高"
            align="center"
            rightClassName="w-44">
            <div className="flex h-8 items-center gap-3 ">
              <Slider
                min={24}
                max={80}
                step={1}
                className="cursor-pointer"
                value={[rowHeight]}
                onValueChange={(value) => handleChange({ rowHeight: value[0] })}
              />
              <span className="text-xs opacity-60 w-12 text-right tabular-nums">{rowHeight}px</span>
            </div>
          </SettingsRow>
        </SettingsItem>

        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">主题设置</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem title="用户名称颜色">
          <div className="flex flex-col gap-2.5">
            <ColorSwatch
              label="天族"
              value={theme.serverAColor}
              onChange={(v) => setThemeColor("serverAColor", v)}
            />
            <ColorSwatch
              label="魔族"
              value={theme.serverBColor}
              onChange={(v) => setThemeColor("serverBColor", v)}
            />
            {/* <ColorSwatch
              label="其他"
              value={theme.serverDefaultColor}
              onChange={(v) => setThemeColor("serverDefaultColor", v)}
            /> */}
          </div>
        </SettingsItem>
        <SettingsItem title="Meter条颜色">
          <div className="flex flex-col gap-2.5">
            <GradientRow
              label="我的角色"
              value={theme.userBar}
              onChange={(v) => setThemeColor("userBar", v)}
            />
            <GradientRow
              label="普通"
              value={theme.normalBar}
              onChange={(v) => setThemeColor("normalBar", v)}
            />
            <GradientRow
              label="警告（贡献度5%以下）"
              value={theme.warningBar}
              onChange={(v) => setThemeColor("warningBar", v)}
            />
            <GradientRow
              label="错误（贡献度3%以下）"
              value={theme.errorBar}
              onChange={(v) => setThemeColor("errorBar", v)}
            />
          </div>
        </SettingsItem>

        <SettingsItem title="Meter文本颜色">
          <div className="flex flex-col gap-2.5">
            <ColorSwatch
              label="累计"
              value={theme.meterStatAmount}
              onChange={(v) => setThemeColor("meterStatAmount", v)}
            />
            <ColorSwatch
              label="DPS"
              value={theme.meterStatDps}
              onChange={(v) => setThemeColor("meterStatDps", v)}
            />
            <ColorSwatch
              label="百分比"
              value={theme.meterStatPercent}
              onChange={(v) => setThemeColor("meterStatPercent", v)}
            />
          </div>
        </SettingsItem>

        <SettingsItem title="BOSS / 战斗记录">
          <div className="flex flex-col gap-2.5">
            <GradientRow
              label="目标 / 战斗记录"
              value={theme.bossBar}
              onChange={(v) => setThemeColor("bossBar", v)}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <ColorSwatch
              label="剩余血量 / 经过时间"
              value={theme.bossRightValue}
              onChange={(v) => setThemeColor("bossRightValue", v)}
            />
          </div>
        </SettingsItem>

        <SettingsItem className="pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTheme}
            className="w-full opacity-50 hover:opacity-100  hover:bg-transition transition-opacity flex items-center gap-2 text-xs">
            <RotateCcw className="w-3 h-3" />
            主题重置
          </Button>
        </SettingsItem>
      </div>

      <div className="pt-4 flex justify-end gap-2 w-full">
        <Button
          onClick={handleCancel}
          size="lg"
          className="p-4 w-20 opacity-60 hover:opacity-100 transition-opacity">
          取消
        </Button>
        <Button
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700 transition-colors p-4 w-20">
          保存
        </Button>
      </div>
    </div>
  );
};
