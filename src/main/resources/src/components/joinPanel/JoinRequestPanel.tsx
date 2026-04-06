import { useEffect, useState } from "react";
import { useJoinRequestStore } from "@/stores/useJoinRequestStore";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerLabel } from "@/utils/parser";
import { getJobIconSrc } from "@/utils/icons";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getSkillName } from "@/constants/codes";
import { JoinRequestSkillSettings } from "./JoinRequestSkillSettings";
import { SkillBadges } from "./SkillBadges";
import { cn } from "@/lib/utils";

const TOTAL_SEC = 20;

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
      <span className="text-xs tabular-nums opacity-60 w-6 text-right">
        {Math.ceil(remaining)}s
      </span>
    </div>
  );
};

export const JoinRequestPanel = ({
  maxWidth,
  isMinimal,
}: {
  maxWidth: number;
  isMinimal: boolean;
}) => {
  const { requests, isOpen, setOpen } = useJoinRequestStore();
  const visibleSkillCodes = useSettingsStore((s) => s.visibleSkillCodes);
  const [skillSettingsOpen, setSkillSettingsOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  const rootClass = cn(
    "group/join text-[rgba(215,215,215)] transition-all duration-200 ease-in-out relative rounded-lg font-bold",
    visible ? "opacity-100 translate-y-2" : "opacity-0 -translate-y-2",
    isMinimal
      ? "bg-transparent group-hover/join:bg-[rgba(12,22,40,0.4)] group-hover/app:bg-[rgba(12,22,40,0.4)]"
      : "bg-[rgba(12,22,40,0.4)]",
  );

  const headerClass = cn(
    "transition-opacity duration-150",
    isMinimal &&
      !skillSettingsOpen &&
      "opacity-0 group-hover/join:opacity-100 group-hover/app:opacity-100",
  );

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
  return (
    <div
      style={{ maxWidth, width: maxWidth }}
      className={rootClass}>
      <div>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 rounded-t-lg">
          <span className={`${headerClass} text-sm`}>파티 신청</span>
          <div className="flex items-center gap-2">
            <span className={`${headerClass} text-xs w-8 text-center`}>{requests.length}건</span>

            <Button
              size="icon"
              variant="ghost"
              className={`${headerClass} rounded-full`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setSkillSettingsOpen((v) => !v)}>
              <Settings className={`scale-125`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`${headerClass} rounded-full`}
              onClick={() => setOpen(false)}>
              <X className={`scale-125`} />
            </Button>
          </div>
        </div>
        <JoinRequestSkillSettings
          open={skillSettingsOpen}
          onOpenChange={setSkillSettingsOpen}
        />
      </div>

      <div>
        {requests.length === 0 ? (
          <div className="flex items-center justify-center py-6 w-full">
            <span className="text-sm">파티 신청이 없습니다</span>
          </div>
        ) : (
          <div
            className="overflow-y-auto scrollbar-gutter:stable"
            style={{ maxHeight: 320 }}>
            {[...requests].reverse().map((r) => {
              const badges = Object.entries(r.skill ?? {})
                .filter(([code]) => visibleSkillCodes.includes(Number(code)))
                .map(([code, lv]) => ({
                  code,
                  name: getSkillName(Number(code)) ?? code,
                  lv,
                }));

              return (
                <div
                  key={r.requester}
                  className="px-4 py-2 border-b border-white/5 last:border-none">
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
                    <span className="text-shadow-meter text-sm tabular-nums text-[#41DCD1] shrink-0">
                      {`${(r.power / 1000).toFixed(1)}k`}
                    </span>
                  </div>

                  {badges.length > 0 && (
                    <div className="mt-1.5 mb-1.5">
                      <SkillBadges
                        badges={badges}
                        job={r.job ?? ""}
                      />
                    </div>
                  )}
                  <TimerBar arrivedAt={r.arrivedAt} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
