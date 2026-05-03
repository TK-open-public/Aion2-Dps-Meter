import { memo, useEffect, useLayoutEffect, useState } from "react";
import { useJoinRequestStore } from "@/stores/useJoinRequestStore";
import { Grip, Settings, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerLabel } from "@/utils/parser";
import { getJobIconSrc } from "@/utils/icons";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getSkillName, SKILL_MAP, SKILL_ORDER_MAP } from "@/constants/codes";
import { JoinRequestSkillSettings } from "./JoinRequestSkillSettings";
import { SkillBadges } from "./SkillBadges";
import { cn } from "@/lib/utils";
import { getClassColor } from "@/utils/classColor";
import { useResizableJoinPanel } from "@/hooks/resize/useResizableJoinPanel";
import { useDraggablePanel } from "@/hooks/drag/useDraggablePanel";
import { ResizeHandle } from "../ResizeHandle";
import { Slider } from "@/components/ui/slider";

const TOTAL_SEC = 20;
const DEFAULT_JOIN_PANEL_GAP = 8;
const DEFAULT_JOIN_PANEL_X = 0;
const DEFAULT_JOIN_PANEL_Y = 8;
const JOIN_PANEL_HEADER_HEIGHT = 44;

const getMeasuredDefaultJoinPanelY = () => {
  const meterRoot = document.querySelector("[data-meter-root-anchor]");
  if (!meterRoot) return DEFAULT_JOIN_PANEL_Y;

  return meterRoot.getBoundingClientRect().bottom + DEFAULT_JOIN_PANEL_GAP;
};

const useDefaultJoinPanelY = () => {
  const [defaultY, setDefaultY] = useState(DEFAULT_JOIN_PANEL_Y);

  useLayoutEffect(() => {
    const meterRoot = document.querySelector("[data-meter-root-anchor]");
    if (!meterRoot) return;

    let rafId: number | null = null;
    const updateDefaultY = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setDefaultY(getMeasuredDefaultJoinPanelY());
        rafId = null;
      });
    };

    updateDefaultY();

    const resizeObserver = new ResizeObserver(updateDefaultY);
    resizeObserver.observe(meterRoot);
    window.addEventListener("resize", updateDefaultY);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDefaultY);
    };
  }, []);

  return defaultY;
};

const clampPanelPosition = (x: number, y: number, width: number, height: number) => {
  const maxX = Math.max(0, window.innerWidth - width);
  const maxY = Math.max(0, window.innerHeight - height);

  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
};

const TimerBar = ({ arrivedAt }: { arrivedAt: number }) => {
  const calc = () => {
    const elapsed = (Date.now() - arrivedAt) / 1000;
    return Math.max(0, TOTAL_SEC - elapsed);
  };

  const [remaining, setRemaining] = useState(calc);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calc();
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [arrivedAt]);

  const pct = (remaining / TOTAL_SEC) * 100;
  const color =
    pct > 50
      ? "linear-gradient(to right, #55c42a, #3a9e20)"
      : pct > 25
        ? "linear-gradient(to right, #e6a817, #c98c0f)"
        : "linear-gradient(to right, #e05252, #b83c3c)";

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-1.5 rounded bg-white/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded transition-all duration-200"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-shadow-meter text-xs w-6 text-right">{Math.ceil(remaining)}s</span>
    </div>
  );
};

export const JoinRequestPanel = memo(() => {
  const requests = useJoinRequestStore((s) => s.requests);
  const isOpen = useJoinRequestStore((s) => s.isOpen);
  const setOpen = useJoinRequestStore((s) => s.setOpen);
  const visibleSkillCodes = useSettingsStore((s) => s.visibleSkillCodes);
  const [skillSettingsOpen, setSkillSettingsOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const { joinPanelHeight, joinPanelWidth, onMouseDownCorner } = useResizableJoinPanel();

  const joinPanelX = useSettingsStore((s) => s.joinPanelX);
  const joinPanelY = useSettingsStore((s) => s.joinPanelY);
  const joinPanelPositioned = useSettingsStore((s) => s.joinPanelPositioned);
  const joinPanelOpacity = useSettingsStore((s) => s.joinPanelOpacity);
  const setJoinPanelOpacity = useSettingsStore((s) => s.setJoinPanelOpacity);
  const setJoinPanelPosition = useSettingsStore((s) => s.setJoinPanelPosition);
  const defaultJoinPanelX = DEFAULT_JOIN_PANEL_X;
  const defaultJoinPanelY = useDefaultJoinPanelY();
  const { x: panelX, y: panelY } = clampPanelPosition(
    joinPanelPositioned ? joinPanelX : defaultJoinPanelX,
    joinPanelPositioned ? joinPanelY : defaultJoinPanelY,
    joinPanelWidth,
    JOIN_PANEL_HEADER_HEIGHT,
  );

  const { panelRef, onMouseDownHandle } = useDraggablePanel({
    initialX: panelX,
    initialY: panelY,
    onPositionChange: setJoinPanelPosition,
    viewportConstraintHeight: JOIN_PANEL_HEADER_HEIGHT,
  });

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      setTimeout(() => setRendered(false), 200);
    }
  }, [isOpen]);

  if (!rendered) return null;

  const positionStyle: React.CSSProperties = {
    left: panelX,
    top: panelY,
    width: joinPanelWidth,
    height: joinPanelHeight,
  };

  const rootClass = cn(
    "text-[rgba(215,215,215)] rounded-lg font-bold",
    "transition-opacity duration-200 ease-in-out",
    "bg-(--join-panel-bg)",
    visible ? "opacity-100" : "opacity-0 pointer-events-none",
  );

  const headerClass = "transition duration-150";
  return (
    <div
      ref={panelRef}
      style={positionStyle}
      className={cn(rootClass, "fixed flex flex-col")}
      onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <div
          className={`${headerClass} flex items-center justify-between px-3 py-1.5 border-b border-white/10 rounded-t-lg`}>
          <div className="flex items-center h-8">
            <div
              className="drag-handle mr-1 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity shrink-0"
              onMouseDown={onMouseDownHandle}
              title="드래그하여 이동">
              <Grip className="size-4 rotate-90" />
            </div>
            <span className={`mr-2 pl-2 flex-1 text-sm`}>파티 신청</span>
            <span className={`text-sm text-center`}>{requests.length}건</span>
          </div>
          <div
            className="flex items-center gap-2 h-8"
            onMouseDown={(e) => e.stopPropagation()}>
            <span className="text-[10px] opacity-50 shrink-0">투명도</span>
            <Slider
              min={0}
              max={1}
              step={0.05}
              className="w-16 cursor-pointer"
              value={[joinPanelOpacity]}
              onValueChange={(value) => setJoinPanelOpacity(value[0])}
            />

            <Button
              size="icon"
              variant="ghost"
              className={`rounded-full `}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setSkillSettingsOpen((v) => !v)}>
              <Settings className="size-4.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`rounded-full`}
              onClick={() => setOpen(false)}>
              <CircleX className="size-4.5" />
            </Button>
          </div>
        </div>

        <JoinRequestSkillSettings
          open={skillSettingsOpen}
          onOpenChange={setSkillSettingsOpen}
        />
      </div>
      <div className="pt-2 flex-1 overflow-y-auto min-h-0 scrollbar-gutter:stable">
        {requests.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm">파티 신청이 없습니다</span>
          </div>
        ) : (
          <div className="py-1">
            {[...requests].reverse().map((r, i) => {
              const allBadges = Object.entries(r.skill ?? {})
                .filter(([code]) => visibleSkillCodes.includes(Number(code)))
                .sort(
                  ([a], [b]) =>
                    (SKILL_ORDER_MAP.get(Number(a)) ?? 999) -
                    (SKILL_ORDER_MAP.get(Number(b)) ?? 999),
                )
                .map(([code, lv]) => ({
                  code,
                  name: getSkillName(Number(code)) ?? code,
                  lv,
                  isStigma: SKILL_MAP.get(Number(code))?.isStigma ?? false,
                }));

              const normalBadges = allBadges.filter((b) => !b.isStigma);
              const stigmaBadges = allBadges.filter((b) => b.isStigma);

              return (
                <div
                  key={r.requester}
                  className={`${i == 0 ? "py-0" : "py-2"} px-3`}>
                  <div className={`${getClassColor(r.job ?? undefined)} p-2 px-3 rounded-lg`}>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={getJobIconSrc(r.job ?? undefined)}
                          className="w-6 h-6 object-contain shrink-0"
                          style={{ filter: "drop-shadow(0 0 3px rgba(20,20,20,0.6))" }}
                        />
                        <span className="text-sm text-shadow-meter truncate">
                          {r.nickname}
                          {getServerLabel(r.server) ? `[${getServerLabel(r.server)}]` : ""}
                        </span>
                      </div>
                      <span className="text-shadow-meter text-sm tabular-nums text-[#10f1e2] shrink-0">
                        {`${(r.power / 1000).toFixed(1)}k`}
                      </span>
                    </div>

                    {(normalBadges.length > 0 || stigmaBadges.length > 0) && (
                      <div className="mt-1.5 mb-1.5 space-y-1">
                        {normalBadges.length > 0 && (
                          <div>
                            <span className="text-[10px] text-white/30 mb-0.5 block">일반</span>
                            <SkillBadges
                              badges={normalBadges}
                              job={r.job ?? ""}
                            />
                          </div>
                        )}
                        {stigmaBadges.length > 0 && (
                          <div>
                            <span className="text-[10px] text-white/30 mb-0.5 block">스티그마</span>
                            <SkillBadges
                              badges={stigmaBadges}
                              job={r.job ?? ""}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <TimerBar arrivedAt={r.arrivedAt} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ResizeHandle onMouseDown={onMouseDownCorner}></ResizeHandle>
    </div>
  );
});
