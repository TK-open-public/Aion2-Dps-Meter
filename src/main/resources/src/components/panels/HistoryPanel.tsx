import { useEffect } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/hooks/useHistory";
import bossIcon from "@/assets/bossIcon.png";

interface Props {
  onClose: () => void;
  onReady?: () => void;
  formatBattleTime: (ms: number) => string;
  onSelectHistory: (idx: number, report: any) => void;
}

const formatDateTime = (ms: number) => {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const HistoryPanel = ({ onClose, onReady, formatBattleTime, onSelectHistory }: Props) => {
  const { historyList, loading, fetchHistory } = useHistory();

  useEffect(() => {
    fetchHistory().then(() => {
      onReady?.();
    });
  }, []);

  const handleUpload = async (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    try {
      window.javaBridge?.upload?.(idx);
    } catch {}
  };

  return (
    <div
      style={{ maxHeight: "60vh" }}
      className="relative text-white font-bold rounded-lg p-4 w-90">
      <div className="flex items-center pb-3 border-b border-white/10">
        <span>전투 기록</span>
        <Button
          className="ml-auto"
          variant="ghost"
          onClick={onClose}>
          <X className="scale-125" />
        </Button>
      </div>

      <div
        className="pt-3 pr-2 flex flex-col gap-2 overflow-y-auto flex-1"
        style={{ maxHeight: "450px" }}>
        {loading && <div className="text-center opacity-40 py-8">불러오는 중</div>}
        {!loading && historyList.length === 0 && (
          <div className="text-center opacity-40 py-8">전투 기록이 없습니다</div>
        )}
        {historyList.map((item) => (
          <div
            onClick={() => onSelectHistory(item.idx, item.raw)}
            key={item.idx}
            className="relative w-full px-3 rounded-lg overflow-hidden bg-black/30 cursor-pointer hover:brightness-125 transition-all duration-200"
            style={{ minHeight: 56 }}>
            <div
              className="absolute inset-0 origin-left"
              style={{
                background: "linear-gradient(to right, #6b0f1a, #5c1a24)",
                opacity: item.isBoss ? 0.8 : 0.2,
              }}
            />
            <div
              className="relative flex items-center gap-3"
              style={{ minHeight: 56 }}>
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 32, height: 32 }}>
                <img
                  src={bossIcon}
                  draggable={false}
                  className={`w-full h-full object-contain ${!item.isBoss ? "opacity-40" : ""}`}
                />
              </div>
              <div className="flex h-full justify-between items-center gap-0.5 flex-1 min-w-0">
                <div className="flex flex-col">
                  <span
                    className="font-bold text-shadow-meter truncate"
                    style={{ color: "#ffffff" }}>
                    {item.mobName}
                  </span>
                  <span className="text-xs font-normal opacity-50">
                    {formatDateTime(item.battleStart)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span
                    className="font-bold text-shadow-meter"
                    style={{ color: "#e63333" }}>
                    {formatBattleTime(item.battleTime)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-0.5 w-7 h-7  hover:none"
                    onClick={(e) => handleUpload(e, item.idx)}>
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
