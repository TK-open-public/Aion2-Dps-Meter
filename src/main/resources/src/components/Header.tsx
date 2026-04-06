import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/logo.png";
import type { PanelType } from "@/types";
import {
  Settings,
  //  RefreshCcw,
  Power,
  ClipboardClock,
  Bug,
  UserRoundPlus,
} from "lucide-react";
// import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useJoinRequestStore } from "@/stores/useJoinRequestStore";

interface Props {
  // isCollapse: boolean;
  reset: () => void;
  setSettings: (value: PanelType) => void;
  // toggleCollapse: () => void;
  className: string;
}
import { useSettingsStore } from "@/stores/useSettingsStore";

export const Header = ({
  className,
  //  reset,
  setSettings,
}: Props) => {
  const isDebugMode = useSettingsStore((s) => s.isDebugMode);
  const { requests, isOpen, setOpen } = useJoinRequestStore();
  const requestCount = requests.length;
  const exitApp = () => {
    (window as any).javaBridge.exitApp();
  };

  const toggleDebugConsole = () => {
    window.dispatchEvent(new CustomEvent("toggle-debug-console"));
  };

  return (
    <div className="">
      <div className=" flex justify-between items-center">
        <div className="w-20 h-full">
          <img
            src={logoSrc}
            className={`${className}`}
          />
        </div>

        <div className={`${className} flex gap-2`}>
          {/* <Tooltip>
            <TooltipTrigger asChild> */}
          <Button
            variant="ghost"
            onClick={exitApp}
            size="icon"
            className="rounded-full">
            <Power className="size-4.5" />
          </Button>
          {/* </TooltipTrigger> */}
          {/* <TooltipContent>종료</TooltipContent> */}
          {/* </Tooltip> */}

          {/* <Tooltip>
            <TooltipTrigger asChild> */}
          {/* <Button
            variant="ghost"
            onClick={reset}
            className="rounded-full">
            <RefreshCcw className="size-4.5" />
          </Button> */}
          {/* </TooltipTrigger>
            <TooltipContent>새로고침</TooltipContent>
          </Tooltip> */}
          <Button
            variant="ghost"
            onClick={() => setOpen(!isOpen)}
            size="icon"
            className="rounded-full relative">
            <UserRoundPlus className="size-4.5" />
            {requestCount > 0 && (
              <span
                className={`${className} absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center font-bold`}>
                {requestCount}
              </span>
            )}
          </Button>

          {/* <Tooltip>
            <TooltipTrigger asChild> */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSettings("settings")}
            className="rounded-full">
            <Settings className="size-4.5" />
          </Button>
          {/* </TooltipTrigger>
            <TooltipContent>설정</TooltipContent>
          </Tooltip> */}

          {/* <Tooltip>
            <TooltipTrigger asChild> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettings("history")}
            className="rounded-full">
            <ClipboardClock className="size-4.5" />
          </Button>
          {/* </TooltipTrigger>
            <TooltipContent>전투 기록</TooltipContent>
          </Tooltip> */}

          {isDebugMode && (
            // <Tooltip>
            //   <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDebugConsole}
              className="rounded-full">
              <Bug className="size-4.5" />
            </Button>
            //   </TooltipTrigger>
            //   <TooltipContent>디버그 콘솔</TooltipContent>
            // </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
