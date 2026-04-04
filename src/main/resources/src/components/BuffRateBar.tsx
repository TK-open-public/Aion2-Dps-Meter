import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { SkillIcon } from "./SkillIcon";

interface BuffRateBarProps {
  id: string;
  rate: number;
  code?: string; 

  info?: BuffInfo;
}
export interface BuffInfo {
  name: string;
  summary: string;
  effect: string;
}

export const BuffRateBar = ({ id, rate, code, info }: BuffRateBarProps) => {
  const pct = Math.min(100, Math.max(0, rate));

  const color =
    pct >= 80
      ? "linear-gradient(to right, #55c42a, #3a9e20)"
      : pct >= 50
        ? "linear-gradient(to right, #e6a817, #c98c0f)"
        : "linear-gradient(to right, #e05252, #b83c3c)";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 p-2 group hover:bg-muted rounded-lg transition-all duration-200 ease-in cursor-pointer">
            <SkillIcon code={code} />
            <span className="w-22 text-sm truncate opacity-90 group-hover:opacity-100">
              {info?.name ?? id}
            </span>

            <div className="relative flex-1 h-5 rounded bg-white/10 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded transition-all duration-300"
                style={{ width: `${pct}%`, background: color }}
              />
              <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold">
                {pct.toFixed(1)}%
              </span>
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="p-0 bg-transparent border-none shadow-none">
          <Card className="px-1 w-58 bg-[#0f1b2e] border border-white/10 shadow-2xl">
            <CardContent className=" space-y-2">
              <div className="flex gap-3 items-center">
                <SkillIcon code={code} />

                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-white">{info?.name ?? id}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/60 whitespace-pre-line leading-relaxed">
                  {info?.effect ? info?.effect : info?.summary ? info?.summary : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
