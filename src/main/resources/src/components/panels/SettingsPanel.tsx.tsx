import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useHotkeyCapture } from "@/hooks/useHotkeyCapture";
import { formatHotkey } from "@/utils/hotKey";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DisplayMode, NameDisplay } from "@/stores/useSettingsStore";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface Props {
  onClose: () => void;
  onReady?: () => void;
}

const DISPLAY_MODES: { value: DisplayMode; label: string; description: string }[] = [
  { value: "dps_percent", label: "DPS / 기여도", description: "45,000/초 (35.5%)" },
  {
    value: "amount_dps_percent",
    label: "누적 / DPS / 기여도",
    description: "1.2M 45,000/초 (35.5%)",
  },
  { value: "amount_percent", label: "누적 / 기여도", description: "1.2M (35.5%)" },
];

const NAME_DISPLAY_MODES: { value: NameDisplay; label: string; description: string }[] = [
  { value: "all", label: "모두 표기", description: "전체 표기" },
  { value: "me_only", label: "나만 표기", description: "나만 전체 표기, 나머지는 딜***" },
  { value: "hidden", label: "모두 숨김", description: "바*** 이*** 트***" },
];

export const SettingsPanel = ({ onClose, onReady }: Props) => {
  const {
    hotkey,
    setHotkey,
    displayMode,
    setDisplayMode,
    nameDisplay,
    setNameDisplay,
    rowHeight,
    setRowHeight,
    isMinimal,
    setIsMinimal,
  } = useSettingsStore();

  const { isCapturing, pending, start, stop, reset } = useHotkeyCapture(hotkey);

  const [snapshot] = useState(() => ({
    hotkey,
    displayMode,
    nameDisplay,
    rowHeight,
    isMinimal,
  }));

  useEffect(() => {
    onReady?.();
  }, []);

  const handleChange = (
    partial: Partial<{
      displayMode: DisplayMode;
      nameDisplay: NameDisplay;
      rowHeight: number;
    }>,
  ) => {
    if (partial.displayMode !== undefined) setDisplayMode(partial.displayMode);
    if (partial.nameDisplay !== undefined) setNameDisplay(partial.nameDisplay);
    if (partial.rowHeight !== undefined) setRowHeight(partial.rowHeight);
  };

  const handleSave = () => {
    setHotkey(pending);
    onClose();
  };

  const handleCancel = () => {
    setDisplayMode(snapshot.displayMode);
    setNameDisplay(snapshot.nameDisplay);
    setRowHeight(snapshot.rowHeight);
    setIsMinimal(snapshot.isMinimal);
    setHotkey(snapshot.hotkey);
    reset(snapshot.hotkey);
    onClose();
  };

  return (
    <div className="font-bold rounded-lg py-4 px-7 w-90">
      <div className="flex items-center pb-3 border-b border-white/10">
        <span>설정</span>
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={handleCancel}>
          <X className="scale-125" />
        </Button>
      </div>

      <div className="py-4 border-b border-white/10">
        <div className="text-sm mb-2 opacity-80">새로고침 단축키</div>
        <input
          readOnly
          onClick={() => {
            if (isCapturing) stop();
            else start();
          }}
          value={formatHotkey(pending.modifiers, pending.vkCode)}
          className="w-full p-2 rounded-md bg-white/5 border text-sm cursor-pointer  "
        />
        {isCapturing && (
          <p className="text-xs text-purple-400 mt-2 opacity-80">
            키 조합을 입력하세요 (Ctrl / Alt + 키)
          </p>
        )}
      </div>

      <div className="py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80">최소화 모드</div>
            <div className="text-xs opacity-40  mt-1">DPS만 표시하고 나머지를 숨깁니다</div>
          </div>
          <Switch
            checked={isMinimal}
            onCheckedChange={(v) => setIsMinimal(v)}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>
      </div>

      <div className="py-4 border-b border-white/10">
        <div className="text-sm mb-3 opacity-80">표시 형식</div>
        <ToggleGroup
          type="single"
          value={displayMode}
          orientation="vertical"
          spacing={1}
          onValueChange={(value) => value && handleChange({ displayMode: value as DisplayMode })}
          className="w-full">
          {DISPLAY_MODES.map(({ value, label, description }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className=" w-full data-[state=on]:border-purple-500 data-[state=on]:bg-purple-500/40
                hover:bg-purple-300/10 hover:text-gray-200 transition-colors
                flex flex-col items-start gap-1 p-3 h-auto">
              <span className="font-bold">{label}</span>
              <span className="text-sm opacity-50 ">{description}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* 아이디 표기 */}
      <div className="py-4 border-b border-white/10">
        <div className="text-sm mb-3 opacity-80">아이디 표기</div>
        <ToggleGroup
          type="single"
          value={nameDisplay}
          spacing={4}
          onValueChange={(value) => value && handleChange({ nameDisplay: value as NameDisplay })}
          className="w-full">
          {NAME_DISPLAY_MODES.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="data-[state=on]:border-purple-500 data-[state=on]:bg-purple-500/40
                hover:bg-purple-300/10 hover:text-gray-200 transition-colors px-4">
              <span className="font-bold">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* 행 높이 */}
      <div className="py-4 border-b border-white/10">
        <div className="text-sm mb-3 opacity-80">행 높이</div>
        <div className="flex items-center gap-3">
          <Slider
            min={28}
            max={64}
            step={1}
            value={[rowHeight]}
            onValueChange={(value) => handleChange({ rowHeight: value[0] })}
          />
          <span className="text-sm opacity-60 w-12 text-right">{rowHeight}px</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
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
