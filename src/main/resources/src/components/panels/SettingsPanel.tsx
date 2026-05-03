import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useHotkeyCapture } from "@/hooks/useHotkeyCapture";
import { formatHotkey } from "@/utils/hotKey";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type {
  DisplayMode,
  FontFamily,
  HeaderPosition,
  NameDisplay,
  ThemeColors,
} from "@/stores/useSettingsStore";
import type { ContributionMode } from "@/types";
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
  registerHeaderClose?: (handler: (() => void) | null) => void;
}

const DISPLAY_MODES: { value: DisplayMode; label: string; description: string }[] = [
  { value: "dps_percent", label: "DPS / 기여도", description: "45,000/초 (35.5%)" },
  {
    value: "amount_dps_percent",
    label: "누적(축약) / DPS / 기여도",
    description: "1.2M 45,000/초 (35.5%)",
  },
  { value: "amount_percent", label: "누적(축약) / 기여도", description: "1.2M (35.5%)" },
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
  { value: "Malgun Gothic", label: "맑은 고딕 (윈도우 기본 폰트)" },
  { value: "NEXON Lv2 Gothic", label: "NEXON Lv2 Gothic" },
  { value: "Spoqa Han Sans Neo", label: "Spoqa Han Sans Neo" },
  { value: "Freesentation", label: "Freesentation" },
  { value: "Tmoney Round Wind", label: "Tmoney Round Wind" },
  { value: "Pretendard", label: "Pretendard" },
];

export const SettingsPanel = ({
  onClose,
  onReady,
  currentVersion,
  updateInfo,
  onCheckUpdate,
  registerHeaderClose,
}: Props) => {
  const {
    // hotkey,
    // setHotkey,
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
    meterOpacity,
    setMeterOpacity,
    meterListOpacity,
    setMeterListOpacity,
    contributionMode,
    setContributionMode,
    // showPower,
    // setShowPower,
    clickThroughHotkey,
    setClickThroughHotkey,
    isClickThrough,
    isAutoHide,
    toggleAutoHide,
  } = useSettingsStore();

  // const { pending,
  //   //  start, stop,
  //    reset } = useHotkeyCapture(hotkey);
  const {
    pending: pendingHide,
    start: startHide,
    stop: stopHide,
    reset: resetHide,
  } = useHotkeyCapture(hideHotkey);
  const {
    pending: pendingClickThrough,
    start: startClickThrough,
    stop: stopClickThrough,
    reset: resetClickThrough,
  } = useHotkeyCapture(clickThroughHotkey);

  const [snapshot] = useState(() => ({
    // hotkey,
    hideHotkey,
    displayMode,
    headerPosition,
    nameDisplay,
    fontFamily,
    rowHeight,
    isMinimal,
    showCombatTimerInMinimal,
    showTargetInfoInMinimal,
    meterOpacity,
    meterListOpacity,
    contributionMode,
    clickThroughHotkey,
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
    // setHotkey(pending);
    setHideHotkey(pendingHide);
    setClickThroughHotkey(pendingClickThrough);

    onClose();
  };

  const handleCancel = useCallback(() => {
    setDisplayMode(snapshot.displayMode);
    setNameDisplay(snapshot.nameDisplay);
    setFontFamily(snapshot.fontFamily);
    setRowHeight(snapshot.rowHeight);
    setIsMinimal(snapshot.isMinimal);
    setShowCombatTimerInMinimal(snapshot.showCombatTimerInMinimal);
    setShowTargetInfoInMinimal(snapshot.showTargetInfoInMinimal);
    resetHide(snapshot.hideHotkey);
    setHeaderPosition(snapshot.headerPosition);
    setTheme(snapshot.theme as ThemeColors);
    setMeterOpacity(snapshot.meterOpacity);
    setMeterListOpacity(snapshot.meterListOpacity);
    setContributionMode(snapshot.contributionMode);
    resetClickThrough(snapshot.clickThroughHotkey);

    onClose();
  }, [
    onClose,
    resetClickThrough,
    resetHide,
    setContributionMode,
    setDisplayMode,
    setFontFamily,
    setHeaderPosition,
    setIsMinimal,
    setMeterListOpacity,
    setMeterOpacity,
    setNameDisplay,
    setRowHeight,
    setShowCombatTimerInMinimal,
    setShowTargetInfoInMinimal,
    setTheme,
    snapshot,
  ]);

  useLayoutEffect(() => {
    registerHeaderClose?.(handleCancel);
    return () => registerHeaderClose?.(null);
  }, [registerHeaderClose, handleCancel]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div className="flex pr-3 min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-gutter:stable py-2">
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
          <span className="text-xs opacity-40 px-2 shrink-0">최소화</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem>
          <SettingsRow
            title="자동 숨김"
            description="아이온2가 포커싱 상태가 아닐 경우 자동으로 숨깁니다.">
            <Switch
              checked={isAutoHide}
              onCheckedChange={toggleAutoHide}
              className="data-[state=checked]:bg-purple-500"
            />
          </SettingsRow>
          <SettingsRow
            title="최소화 단축키 설정"
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
          <span className="text-xs opacity-40 px-2 shrink-0">패스스루</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem>
          <SettingsRow
            title="패스스루"
            description="클릭이 미터기를 통과해 게임으로 전달됩니다.">
            <Switch
              checked={isClickThrough}
              disabled
              className="data-[state=checked]:bg-purple-500"
            />
          </SettingsRow>

          <SettingsRow
            title="패스스루 단축키 설정"
            align="center"
            rightClassName="w-44">
            <SettingsControlInput
              readOnly
              onFocus={startClickThrough}
              onBlur={stopClickThrough}
              value={formatHotkey(pendingClickThrough.modifiers, pendingClickThrough.vkCode)}
              className="cursor-pointer"
            />
          </SettingsRow>
        </SettingsItem>

        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">컴팩트 모드</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem>
          <SettingsRow title="컴팩트 모드">
            <Switch
              checked={isMinimal}
              onCheckedChange={(v) => setIsMinimal(v)}
              className="data-[state=checked]:bg-purple-500"
            />
          </SettingsRow>

          <SettingsRow title="컴팩트 모드 중 전투 시간 표시">
            <Switch
              checked={showCombatTimerInMinimal}
              onCheckedChange={(v) => setShowCombatTimerInMinimal(v)}
              className="data-[state=checked]:bg-purple-500 disabled:opacity-30"
            />
          </SettingsRow>

          <SettingsRow title="컴팩트 모드 중 보스 표시">
            <Switch
              checked={showTargetInfoInMinimal}
              onCheckedChange={(v) => setShowTargetInfoInMinimal(v)}
              className="data-[state=checked]:bg-purple-500 disabled:opacity-30"
            />
          </SettingsRow>
        </SettingsItem>

        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">미터기 설정</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        {/* <SettingsRow
          title="전투력 표시"
          description="이름 옆에 전투력을 표시합니다">
          <Switch
            checked={showPower}
            onCheckedChange={(v) => setShowPower(v)}
            className="data-[state=checked]:bg-purple-500"
          />
        </SettingsRow> */}
        <SettingsItem>
          <SettingsRow
            title="기여도 표시 방식"
            align="center"
            rightClassName="w-44">
            <Select
              value={contributionMode}
              onValueChange={(v) => setContributionMode(v as ContributionMode)}>
              <SelectTrigger className="text-xs w-44 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="contribution"
                  className="px-4 py-2">
                  파티 기여도 (상대)
                </SelectItem>
                <SelectItem
                  value="entireContribution"
                  className="px-4 py-2">
                  보스 체력 기여도 (절대)
                </SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>

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

        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs opacity-40 px-2 shrink-0">테마 설정</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <SettingsItem title="투명도 조정">
          <SettingsRow
            title="미터 목록 투명도"
            align="center"
            rightClassName="w-44">
            <div className="flex h-8 items-center gap-3">
              <Slider
                min={0.1}
                max={1}
                step={0.05}
                className="cursor-pointer"
                value={[meterListOpacity]}
                onValueChange={(value) => setMeterListOpacity(value[0])}
              />
              <span className="text-xs opacity-60 w-12 text-right tabular-nums">
                {Math.round(meterListOpacity * 100)}%
              </span>
            </div>
          </SettingsRow>
          <SettingsRow
            title="미터 배경 투명도"
            align="center"
            rightClassName="w-44">
            <div className="flex h-8 items-center gap-3">
              <Slider
                min={0}
                max={1}
                step={0.05}
                className="cursor-pointer"
                value={[meterOpacity]}
                onValueChange={(value) => setMeterOpacity(value[0])}
              />
              <span className="text-xs opacity-60 w-12 text-right tabular-nums">
                {Math.round(meterOpacity * 100)}%
              </span>
            </div>
          </SettingsRow>
        </SettingsItem>

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
            <ColorSwatch
              label="전투 시간"
              value={theme.combatTimeColor}
              onChange={(v) => setThemeColor("combatTimeColor", v)}
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
      <div className="flex w-full min-w-0 shrink-0 justify-end gap-2 border-t border-white/10 pt-4">
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
