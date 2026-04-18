import { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { SkillIcon } from "../SkillIcon";
import { getClassColor } from "@/utils/classColor";
import { GROUPED_BY_JOB, getSkillName } from "@/constants/codes";
import { cn } from "@/lib/utils";
export const JoinRequestSkillSettings = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const { visibleSkillCodes, setVisibleSkillCodes } = useSettingsStore();
  const panelRef = useRef<HTMLDivElement>(null);

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

  const toggleAll = (codes: number[], checked: boolean) => {
    setVisibleSkillCodes(
      checked
        ? Array.from(new Set([...visibleSkillCodes, ...codes]))
        : visibleSkillCodes.filter((c) => !codes.includes(c)),
    );
  };

  const panelClass = cn(
    "min-w-0 fixed w-100 top-0 left-full ml-2 h-auto z-50",
    "bg-(--panel-bg) text-white rounded-lg",
    "transition-all duration-200 ease-in-out",
    visible ? "visible opacity-100 translate-x-2" : "invisible opacity-0 translate-x-0",
  );

  return (
    <div className="cursor-auto">
      <div
        ref={panelRef}
        className={panelClass}>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm">표시할 스킬 선택</span>
          <Button
            variant="ghost"
            className="opacity-70 hover:opacity-100"
            onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </div>

        <div className="px-5 pb-3 space-y-4 max-h-114 overflow-y-auto">
          {GROUPED_BY_JOB.map(({ job, skills }) => {
            if (skills.length === 0) return null;
            const allChecked = skills.every((c) => visibleSkillCodes.includes(c));

            return (
              <div
                key={job}
                className="py-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/40 font-semibold">{job}</span>
                  <button
                    onClick={() => toggleAll(skills, !allChecked)}
                    className="cursor-pointer text-xs text-white/30 hover:text-white/60 transition-colors">
                    {allChecked ? "전체 해제" : "전체 선택"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.map((code) => (
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
          })}
        </div>
      </div>
    </div>
  );
};
