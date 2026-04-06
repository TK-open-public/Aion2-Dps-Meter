import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useHotkeyCapture } from "@/hooks/useHotkeyCapture";
import { formatHotkey } from "@/utils/hotKey";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
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
  { value: "dps_percent", label: "DPS / 기여도", description: "45,000/초 (35.5%)" },
  {
    value: "amount_dps_percent",
    label: "누적 / DPS / 기여도",
    description: "1.2M 45,000/초 (35.5%)",
  },
  { value: "amount_percent", label: "누적 / 기여도", description: "1.2M (35.5%)" },
  {
    value: "amount_full_dps_percent",
    label: "누적(전체) / DPS / 기여도",
    description: "1,234,567 45,000/초 (35.5%)",
  },
  { value: "amount_full_percent", label: "누적(전체) / 기여도", description: "1,234,567 (35.5%)" },
];

const NAME_DISPLAY_MODES: { value: NameDisplay; label: string }[] = [
  { value: "all", label: "모두 표기" },
  { value: "me_only", label: "나만 표기" },
  { value: "hidden", label: "모두 숨김" },
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
    showPower,
    setShowPower,
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
        <span>설정</span>
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
            title="버전 정보"
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
              {updateInfo ? `v${updateInfo.latestVersion} 업데이트` : "업데이트 확인"}
            </Button>
          </SettingsRow>
        </SettingsItem>

        <SettingsItem>
          <SettingsRow
            title="컴팩트 모드"
            description="DPS만 표시하고 나머지를 숨깁니다">
            <Switch
              checked={isMinimal}
              onCheckedChange={(v) => setIsMinimal(v)}
              className="data-[state=checked]:bg-purple-500"
            />
          </SettingsRow>
        </SettingsItem>

        <SettingsItem>
          <SettingsRow
            title="폰트"
            description="표시 글꼴을 선택합니다"
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
            title="버튼 위치"
            description="헤더 버튼의 위치를 설정합니다">
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
                  상단
                </SelectItem>
                <SelectItem
                  value="bottom"
                  className="px-4 py-2">
                  하단
                </SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsItem>
        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">단축키 설정</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem>
          <SettingsRow
            title="새로고침"
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
            title="최소화"
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
          <span className="text-xs opacity-40 px-2 shrink-0">미터기 설정</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
       <SettingsRow
            title="전투력 표시"
            description="이름 옆에 전투력을 표시합니다">
            <Switch
              checked={showPower}
              onCheckedChange={(v) => setShowPower(v)}
              className="data-[state=checked]:bg-[#10f1e2]/70"
            />
          </SettingsRow>
        <SettingsItem>
          <SettingsRow
            title="표시 형식"
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
            title="아이디 표기"
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
            title="행 높이"
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

        {/* ── 테마 설정 ── */}
        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">테마 설정</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem title="유저 이름 색상">
          <div className="flex flex-col gap-2.5">
            <ColorSwatch
              label="천족"
              value={theme.serverAColor}
              onChange={(v) => setThemeColor("serverAColor", v)}
            />
            <ColorSwatch
              label="마족"
              value={theme.serverBColor}
              onChange={(v) => setThemeColor("serverBColor", v)}
            />
            {/* <ColorSwatch
              label="기타"
              value={theme.serverDefaultColor}
              onChange={(v) => setThemeColor("serverDefaultColor", v)}
            /> */}
          </div>
        </SettingsItem>
        <SettingsItem title="미터 바 색상">
          <div className="flex flex-col gap-2.5">
            <GradientRow
              label="내 캐릭터"
              value={theme.userBar}
              onChange={(v) => setThemeColor("userBar", v)}
            />
            <GradientRow
              label="일반"
              value={theme.normalBar}
              onChange={(v) => setThemeColor("normalBar", v)}
            />
            <GradientRow
              label="경고 (기여도 5% 미만)"
              value={theme.warningBar}
              onChange={(v) => setThemeColor("warningBar", v)}
            />
            <GradientRow
              label="에러 (기여도 3% 미만)"
              value={theme.errorBar}
              onChange={(v) => setThemeColor("errorBar", v)}
            />
          </div>
        </SettingsItem>

        <SettingsItem title="미터 텍스트 색상">
          <div className="flex flex-col gap-2.5">
            <ColorSwatch
              label="누적"
              value={theme.meterStatAmount}
              onChange={(v) => setThemeColor("meterStatAmount", v)}
            />
            <ColorSwatch
              label="DPS"
              value={theme.meterStatDps}
              onChange={(v) => setThemeColor("meterStatDps", v)}
            />
            <ColorSwatch
              label="퍼센트"
              value={theme.meterStatPercent}
              onChange={(v) => setThemeColor("meterStatPercent", v)}
            />
          </div>
        </SettingsItem>

        <SettingsItem title="보스 / 전투 기록">
          <div className="flex flex-col gap-2.5">
            <GradientRow
              label="타겟 / 전투 기록"
              value={theme.bossBar}
              onChange={(v) => setThemeColor("bossBar", v)}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <ColorSwatch
              label="남은 체력 / 경과 시간"
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
            테마 초기화
          </Button>
        </SettingsItem>
      </div>

      <div className="pt-4 flex justify-end gap-2 w-full">
        <Button
          onClick={handleCancel}
          size="lg"
          className="p-4 w-20 opacity-60 hover:opacity-100 transition-opacity">
          취소
        </Button>
        <Button
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700 transition-colors p-4 w-20">
          저장
        </Button>
      </div>
    </div>
  );
};
