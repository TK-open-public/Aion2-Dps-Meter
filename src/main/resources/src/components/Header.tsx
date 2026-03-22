import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/logo.png";
import type { PanelType } from "@/types";
import {
  Settings,
  RefreshCcw,
  Power,
  // ArrowUpFromLine,
  // ArrowDownFromLine,
  ClipboardClock,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
interface Props {
  isCollapse: boolean;
  reset: () => void;
  setSettings: (value: PanelType) => void;
  toggleCollapse: () => void;
  className: string;
}
export const Header = ({
  className,
  // isCollapse,
  reset,
  setSettings,
  //  toggleCollapse
}: Props) => {
  const exitApp = () => {
    (window as any).javaBridge.exitApp();
  };
  return (
    <div className="drag-area cursor-move select-none">
      <div className="pb-4  flex justify-between items-center ">
        <div className="w-20 h-full">
          <img
            src={logoSrc}
            className={` ${className}`}
          />
        </div>

        <div className="flex  gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={exitApp}
                className="rounded-full">
                <Power className={`scale-125 ${className}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>종료</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={reset}
                className="rounded-full">
                <RefreshCcw className={`scale-125 ${className}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>새로고침</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => setSettings("settings")}
                className="rounded-full">
                <Settings className={`scale-125 ${className}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>설정</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettings("history")}
                className="rounded-full">
                <ClipboardClock className={`scale-125 ${className} `} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>전투 기록</TooltipContent>
          </Tooltip>

          {/* <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="rounded-full">
            {isCollapse ? (
              <ArrowDownFromLine className={`scale-125 ${className}`} />
            ) : (
              <ArrowUpFromLine className={`scale-125 ${className}`} />
            )}
          </Button> */}
        </div>
      </div>
    </div>
  );
};
