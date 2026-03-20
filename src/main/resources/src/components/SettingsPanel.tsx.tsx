import { useEffect } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useHotkeyCapture } from "../hooks/useHotkeyCapture";
import { formatHotkey, parseHotkeyString } from "../utils/hotKey";

interface Props {
  onClose: () => void;
  onReady?: () => void;
}

export const SettingsPanel = ({ onClose, onReady }: Props) => {
  const { hotkey, setHotkey } = useSettingsStore();
  const { isCapturing, pending, start, stop, reset } = useHotkeyCapture(hotkey);
 

  useEffect(() => {
    const jb = (window as any).javaBridge;
    const raw = jb?.getHotkey?.() ?? jb?.getHotKey?.();
    const parsed = parseHotkeyString(raw);

    if (parsed) {
      setHotkey(parsed);
      reset(parsed);
    }
    onReady?.();

  }, []);

  const handleSave = () => {
    setHotkey(pending);
    (window as any).javaBridge?.updateHotkey?.(pending.modifiers, pending.vkCode);
    onClose();
  };

  return (
    <div className="p-4 w-[360px]">
      <div className="text-sm mb-2">Hotkey</div>

      <input
        readOnly
        onClick={() => {
          if (isCapturing) stop();
          else start();
        }}
        value={formatHotkey(pending.modifiers, pending.vkCode)}
        className={`w-full p-2 border ${isCapturing ? "border-purple-500" : "border-gray-700"}`}
      />

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose}>취소</button>
        <button onClick={handleSave}>저장</button>
      </div>
    </div>
  );
};
