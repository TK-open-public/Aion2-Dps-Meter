import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Player, Details } from "@/types";
import { useDetails } from "@/hooks/useDetails";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResizableDetail } from "@/hooks/useResizableDetail";

interface Props {
  player: Player | null;
  onClose: () => void;
  onReady?: () => void;
  combatTime: string;
}

const col = { name: 180, stat: 80, dmg: 220 };

export const DetailsPanel = ({ player, onClose, onReady, combatTime }: Props) => {
  const { getDetails } = useDetails();
  const [details, setDetails] = useState<Details | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  const { detailHeight, onMouseDown } = useResizableDetail();

  useEffect(() => {
    if (!player) return;
    setDetails(null);
    getDetails(player, combatTime).then((data) => {
      setDetails(data);
    });
  }, [player]);

  useLayoutEffect(() => {
    if (details) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onReady?.();
        });
      });
    }
    if (scrollRef.current) {
      setHasScroll(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
    }
  }, [details?.skills]);
  const FIXED_AREA_HEIGHT = 264;

  if (!player || !details) return null;

  return (
    <div className="relative text-white font-bold rounded-lg py-4 px-7">
      {/* 헤더 */}
      <div className="flex items-center pb-3 border-b border-white/10">
        <span>{player.name} 상세내역</span>
        <Button
          className="ml-auto"
          variant="ghost"
          onClick={onClose}>
          <X className="scale-125" />
        </Button>
      </div>

      {/* 스탯 그리드 */}
      {details && (
        <div className="grid grid-cols-2 py-3">
          {[
            { label: "누적 피해량", value: details.totalDmg.toLocaleString() },
            { label: "피해량 기여도", value: `${details.contributionPct.toFixed(1)}%` },
            { label: "치명타 비율", value: `${details.totalCritPct}%` },
            { label: "완벽 비율", value: `${details.totalPerfectPct}%` },
            { label: "강타 비율", value: `${details.totalDoublePct}%` },
            { label: "백어택 비율", value: `${details.totalBackPct}%` },
            { label: "보스 막기비율", value: `${details.totalParryPct}%` },
            { label: "전투시간", value: `${combatTime}` },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex justify-between mb-2 ${i % 2 === 0 ? "pr-4" : "pl-4"}`}>
              <span className="opacity-80">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 스킬 헤더 */}
      <div className="flex items-center py-3 gap-2 border-b border-white/10">
        <span
          className="text-left shrink-0"
          style={{ width: col.name }}>
          스킬명
        </span>
        <span
          className="text-center shrink-0"
          style={{ minWidth: col.stat }}>
          타격횟수
        </span>
        <span
          className="text-center shrink-0"
          style={{ minWidth: col.stat }}>
          치명타
        </span>
        <span
          className="text-center shrink-0"
          style={{ minWidth: col.stat }}>
          패리
        </span>
        <span
          className="text-center shrink-0"
          style={{ minWidth: col.stat }}>
          완벽
        </span>
        <span
          className="text-center shrink-0"
          style={{ minWidth: col.stat }}>
          강타
        </span>
        <span
          className="text-center shrink-0"
          style={{ minWidth: col.stat }}>
          백어택
        </span>
        <span
          className="text-center shrink-0"
          style={{ width: col.dmg }}>
          누적 피해량
        </span>
      </div>

      {/* 스킬 목록 */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: Math.max(100, detailHeight - FIXED_AREA_HEIGHT) }}>
        <div className={hasScroll ? "pr-6" : ""}>
          {details.skills.map((s, i) => {
            const ratio = s.dmg / (details.totalDmg || 1);
            return (
              <div
                key={s.code}
                className="flex items-center gap-2 py-1.5"
                style={{
                  borderBottom:
                    i < details.skills.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}>
                <span
                  className="text-left text-row-fill truncate shrink-0"
                  style={{ width: col.name }}>
                  {s.name}
                </span>
                <span
                  className="text-center shrink-0"
                  style={{ minWidth: col.stat }}>
                  {s.time}
                </span>
                <span
                  className="text-center shrink-0"
                  style={{ minWidth: col.stat }}>
                  {s.critPct}%
                </span>
                <span
                  className="text-center shrink-0"
                  style={{ minWidth: col.stat }}>
                  {s.parryPct}%
                </span>
                <span
                  className="text-center shrink-0"
                  style={{ minWidth: col.stat }}>
                  {s.perfectPct}%
                </span>
                <span
                  className="text-center shrink-0"
                  style={{ minWidth: col.stat }}>
                  {s.doublePct}%
                </span>
                <span
                  className="text-center shrink-0"
                  style={{ minWidth: col.stat }}>
                  {s.backPct}%
                </span>

                <div
                  className="relative h-8 shrink-0 text-end"
                  style={{ width: col.dmg }}>
                  <div
                    className="absolute inset-0 origin-left rounded-md bg-isUser-fill"
                    style={{ transform: `scaleX(${ratio})` }}
                  />
                  <div className="relative z-10 h-full flex items-center justify-end gap-2 text-dps">
                    <span>{s.dmg.toLocaleString()}</span>
                    <span>({(ratio * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 드래그 핸들 */}
      <div
        onMouseDown={onMouseDown}
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-3 cursor-s-resize flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity group">
        <div className="w-8 h-1 rounded-full bg-white  transition-colors" />
      </div>
    </div>
  );
};
