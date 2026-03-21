import { Button } from "@/components/ui/button";
import logoSrc from "../assets/logo.png";
import type { PanelType } from "@/types";
import {
  Settings,
  RefreshCcw,
  // ArrowUpFromLine,
  // ArrowDownFromLine,
  ClipboardClock,
} from "lucide-react";
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
          <Button
            variant="ghost"
            onClick={reset}
            className="rounded-full">
            <RefreshCcw className={`scale-125 ${className}`} />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSettings("settings")}
            className="rounded-full">
            <Settings className={`scale-125 ${className}`} />
          </Button>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettings("history")}
            className="rounded-full">
            <ClipboardClock className={`scale-125 ${className} `} />
          </Button>
        </div>
      </div>
    </div>
  );
};
