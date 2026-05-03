import { useCallback, useEffect, useRef, useState } from "react";
import type { CheckStatus, Player, UpdateInfo, PanelType, DownloadState } from "@/types";
import { DetailsPanel } from "./DetailsPanel";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { UpdatePanel, UPDATE_PANEL_DOT_CLS, UPDATE_PANEL_HEADER_TITLE } from "./UpdatePanel";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { HistoryPanel } from "./HistoryPanel";
import { useDraggablePanel } from "@/hooks/drag/useDraggablePanel";
import { useSidePanelResize } from "@/hooks/resize/useSidePanelResize";
import { CircleX, Grip } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button";
import { ResizeHandle } from "../ResizeHandle.tsx";
import { Slider } from "@/components/ui/slider";

const SIDE_BODY_VIEWPORT = "min-h-0 shrink-0 flex flex-col overflow-hidden";

const SIDE_OUTER = "flex h-full min-h-0 w-full flex-col overflow-hidden";
const DEFAULT_SIDE_PANEL_GAP = 8;

const SIDE_SHELL = {
  details: `${SIDE_OUTER} py-4 px-7 text-white font-bold`,
  settings: `${SIDE_OUTER} pl-5 pr-3  pb-6 font-bold rounded-lg`,
  history: `${SIDE_OUTER} text-white font-bold rounded-lg p-4`,
  update: `${SIDE_OUTER} font-semibold`,
} as const;

interface SidePanelProps {
  type: PanelType;
  player: Player | null;
  onClose: () => void;
  combatTime: string;
  updateInfo?: UpdateInfo | null;
  onUpdate?: () => void;
  formatBattleTime: (ms: number) => string;
  onSelectHistory: (idx: number, report: any) => void;
  historyIdx?: number;
  onOpenReleasePage: () => void;
  downloadState: DownloadState;
  checkStatus: CheckStatus;
  onRetryDownload: () => void;
  currentVersion?: string;
  onCheckUpdate?: () => void;
  players: Player[];
}

export const SidePanel = ({
  type,
  player,
  players,
  onClose,
  combatTime,
  updateInfo,
  onSelectHistory,
  onUpdate,
  downloadState,
  onRetryDownload,
  onOpenReleasePage,
  historyIdx,
  formatBattleTime,
  currentVersion,
  checkStatus,
  onCheckUpdate,
}: SidePanelProps) => {
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [currentType, setCurrentType] = useState<PanelType>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const sidePanelX = useSettingsStore((s) => s.sidePanelX);
  const sidePanelY = useSettingsStore((s) => s.sidePanelY);
  const sidePanelPositioned = useSettingsStore((s) => s.sidePanelPositioned);
  const meterWidth = useSettingsStore((s) => s.meterWidth);
  const panelOpacity = useSettingsStore((s) => s.panelOpacity);
  const setPanelOpacity = useSettingsStore((s) => s.setPanelOpacity);
  const setSidePanelPosition = useSettingsStore((s) => s.setSidePanelPosition);
  const defaultSidePanelX = meterWidth + DEFAULT_SIDE_PANEL_GAP;
  const defaultSidePanelY = 8;

  const { panelRef, onMouseDownHandle, isPositioned } = useDraggablePanel({
    initialX: sidePanelPositioned ? sidePanelX : defaultSidePanelX,
    initialY: sidePanelPositioned ? sidePanelY : defaultSidePanelY,
    onPositionChange: setSidePanelPosition,
  });

  const { panelWidth, panelHeight, onMouseDownCorner } = useSidePanelResize(currentType);

  const settingsHeaderCloseRef = useRef<(() => void) | null>(null);
  const registerSettingsHeaderClose = useCallback((handler: (() => void) | null) => {
    settingsHeaderCloseRef.current = handler;
  }, []);

  const handleHeaderClose = () => {
    if (currentType === "settings") {
      settingsHeaderCloseRef.current?.();
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (type) {
      setCurrentType(type);
      setCurrentPlayer(player);
      if (!rendered) {
        setRendered(true);
        setTimeout(() => setVisible(true), 10);
      }
    } else {
      setVisible(false);
      setTimeout(() => {
        setRendered(false);
        setCurrentType(null);
      }, 200);
    }
  }, [type, player]);
  if (!rendered) return null;

  const updateShowClose =
    currentType === "update" &&
    downloadState.status !== "downloading" &&
    downloadState.status !== "complete";

  const detailsTitle =
    currentType === "details"
      ? currentPlayer
        ? `${currentPlayer.name} 상세내역`
        : "상세내역"
      : "";

  const positionStyle: React.CSSProperties = isPositioned
    ? {
        left: sidePanelPositioned ? sidePanelX : defaultSidePanelX,
        top: sidePanelPositioned ? sidePanelY : defaultSidePanelY,
        width: panelWidth,
      }
    : { width: panelWidth };

  const rootClass = cn(
    "text-[rgba(215,215,215)] rounded-lg font-bold",
    "transition-opacity duration-200 ease-in-out",
    "bg-(--panel-bg)",
    visible ? "opacity-100" : "opacity-0 pointer-events-none",
  );

  return (
    <div
      ref={panelRef}
      style={positionStyle}
      className={cn(rootClass, "fixed left-0 top-0 flex flex-col overflow-hidden ")}
      onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center shrink-0 pl-5 px-3 py-1.5 border-b border-white/10 gap-2">
        <div
          className="drag-handle mr-1 cursor-grab active:cursor-grabbing opacity-70 hover:opacity-70 transition-opacity shrink-0"
          onMouseDown={onMouseDownHandle}
          title="드래그하여 이동">
          <Grip className="size-4 rotate-90" />
        </div>
        {currentType === "update" ? (
          <>
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${UPDATE_PANEL_DOT_CLS[downloadState.status]}`}
            />
            <span className="flex-1 text-sm truncate">
              {UPDATE_PANEL_HEADER_TITLE[downloadState.status]}
            </span>
          </>
        ) : (
          <span className="flex-1  text-sm truncate">
            {currentType === "details"
              ? detailsTitle
              : currentType === "settings"
                ? "설정"
                : currentType === "history"
                  ? "전투 기록"
                  : null}
          </span>
        )}
        <div
          className="flex items-center gap-2 shrink-0"
          onMouseDown={(e) => e.stopPropagation()}>
          <span className="text-[10px] opacity-50">투명도</span>
          <Slider
            min={0}
            max={1}
            step={0.05}
            className="w-16 cursor-pointer"
            value={[panelOpacity]}
            onValueChange={(value) => setPanelOpacity(value[0])}
          />
        </div>
        {!(currentType === "update" && !updateShowClose) && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className={`rounded-full`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleHeaderClose}>
              <CircleX className="size-4.5" />
            </Button>
          </>
        )}
      </div>

      <div
        style={{ height: panelHeight }}
        className={SIDE_BODY_VIEWPORT}>
        {currentType === "details" && (
          <div
            key={currentPlayer?.id}
            className={SIDE_SHELL.details}>
            <DetailsPanel
              player={currentPlayer}
              players={players}
              combatTime={combatTime}
              historyIdx={historyIdx}
            />
          </div>
        )}
        {currentType === "settings" && (
          <div className={SIDE_SHELL.settings}>
            <SettingsPanel
              onClose={onClose}
              currentVersion={currentVersion}
              updateInfo={updateInfo}
              onCheckUpdate={onCheckUpdate}
              registerHeaderClose={registerSettingsHeaderClose}
            />
          </div>
        )}
        {currentType === "update" && (
          <div className={SIDE_SHELL.update}>
            <UpdatePanel
              updateInfo={updateInfo ?? null}
              checkStatus={checkStatus}
              onClose={onClose}
              downloadState={downloadState}
              onRetryDownload={onRetryDownload}
              onUpdate={onUpdate ?? (() => {})}
              onOpenReleasePage={onOpenReleasePage}
            />
          </div>
        )}
        {currentType === "history" && (
          <div
            key={currentPlayer?.id}
            className={SIDE_SHELL.history}>
            <HistoryPanel
              formatBattleTime={formatBattleTime}
              onSelectHistory={onSelectHistory}
            />
          </div>
        )}
      </div>
      {currentType !== "update" && <ResizeHandle onMouseDown={onMouseDownCorner}></ResizeHandle>}
    </div>
  );
};
