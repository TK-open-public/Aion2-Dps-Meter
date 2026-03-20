import { Button } from "@/components/ui/button";
import logoSrc from "../assets/logo.png";
import type { PanelType } from "./SidePanel";
import {
  Settings,
  RefreshCcw,
  ArrowUpFromLine,
  ArrowDownFromLine,
  ClipboardClock,
} from "lucide-react";
interface Props {
  isCollapse: boolean;
  reset: () => void;
  setSettings: (value: PanelType) => void;
  toggleCollapse: () => void;
}
export const Header = ({ isCollapse, reset, setSettings, toggleCollapse }: Props) => {
  return (
    <div className="drag-area cursor-move select-none flex justify-between items-center -mr-1.5">
      <div className="">
        <img
          src={logoSrc}
          className="w-20"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={reset}
          className="rounded-full">
          <RefreshCcw className="scale-125" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => setSettings("settings")}
          className="rounded-full">
          <Settings className="scale-125" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="rounded-full">
          {isCollapse ? (
            <ArrowDownFromLine className="scale-125" />
          ) : (
            <ArrowUpFromLine className="scale-125" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="rounded-full">
          <ClipboardClock className="scale-125" />
        </Button>
      </div>
    </div>
  );
};
