import { memo, useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { SkillIcon } from "../SkillIcon";
import { getClassColor } from "@/utils/classColor";
import { GROUPED_BY_JOB, getSkillName } from "@/constants/codes";
import { cn } from "@/lib/utils";
import { getJobIconSrc } from "@/utils/icons";

export const JoinRequestSkillSettings = memo(({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const visibleSkillCodes = useSettingsStore((s) => s.visibleSkillCodes);
  const setVisibleSkillCodes = useSettingsStore((s) => s.setVisibleSkillCodes);
  const panelRef = useRef<HTMLDivElement>(null);
  const joinPanelWidth = useSettingsStore((s) => s.joinPanelWidth);
  const joinPanelHeight = useSettingsStore((s) => s.joinPanelHeight);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => setVisible(true), 10);
    else setVisible(false);
  }, [open]);

  const toggle = (code: number) => {
    setVisibleSkillCodes(
      visibleSkillCodes.includes(code)
        ? visibleSkillCodes.filter((c) => c !== code)
        : [...visibleSkillCodes, code],
    );
  };

  const toggleGroup = (codes: number[], checked: boolean) => {
    setVisibleSkillCodes(
      checked
        ? Array.from(new Set([...visibleSkillCodes, ...codes]))
        : visibleSkillCodes.filter((c) => !codes.includes(c)),
    );
  };

  const panelClass = cn(
    "absolute top-0 left-full ml-2 z-50",
    "bg-(--join-panel-bg) text-white rounded-lg",
    "transition-all duration-200 ease-in-out",
    visible ? "visible opacity-100 translate-x-0" : "invisible opacity-0 -translate-x-1",
  );

  const SkillGroup = ({ label, codes, job }: { label: string; codes: number[]; job: string }) => {
    if (codes.length === 0) return null;
    const allChecked = codes.every((c) => visibleSkillCodes.includes(c));
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40 font-semibold">{label}</span>
          <button
            onClick={() => toggleGroup(codes, !allChecked)}
            className="cursor-pointer text-xs text-white/30 hover:text-white/60 transition-colors">
            {allChecked ? "전체 해제" : "전체 선택"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {codes.map((code) => (
            <Button
              key={code}
              size="sm"
              onClick={() => toggle(code)}
              className={cn(
                "flex items-center text-xs px-3 gap-2 rounded-xl",
                getClassColor(job),
                visibleSkillCodes.includes(code) ? "opacity-100" : "opacity-40",
              )}>
              <SkillIcon
                code={code}
                size={14}
              />
              <span>{getSkillName(code) ?? code}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="cursor-auto">
      <div
        ref={panelRef}
        className={panelClass}
        style={{ width: joinPanelWidth }}>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm">표시할 스킬 선택</span>
          <Button
            variant="ghost"
            className="opacity-70 hover:opacity-100"
            onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </div>

        <div
          className="px-5 pb-4 space-y-6 overflow-y-auto"
          style={{ maxHeight: joinPanelHeight - 60 }}>
          {GROUPED_BY_JOB.map(({ job, normalSkills, stigmaSkills }) => {
            if (normalSkills.length === 0 && stigmaSkills.length === 0) return null;
            return (
              <div key={job}>
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-3 pb-1 ">
                  <img
                    src={getJobIconSrc(job)}
                    className="w-5 h-5 object-contain"
                    style={{ filter: "drop-shadow(0 0 3px rgba(20,20,20,0.6))" }}
                  />
                  {job}
                </div>
                <div className="space-y-4 pl-1">
                  <SkillGroup
                    label="일반 스킬"
                    codes={normalSkills}
                    job={job}
                  />
                  <SkillGroup
                    label="스티그마"
                    codes={stigmaSkills}
                    job={job}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
