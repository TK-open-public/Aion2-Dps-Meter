import { useEffect, useState, useRef } from "react";
import type { CheckStatus, Player, UpdateInfo, PanelType, DownloadState } from "@/types";
import { DetailsPanel } from "./DetailsPanel";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { UpdatePanel } from "./UpdatePanel";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { HistoryPanel } from "./HistoryPanel";

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
}

export const SidePanel = ({
  type,
  player,
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
  const pendingRef = useRef<{ type: PanelType; player: Player | null } | null>(null);

  const openPanel = (panelType: PanelType, panelPlayer: Player | null) => {
    setCurrentType(panelType);
    setCurrentPlayer(panelPlayer);
    setRendered(true);
    setTimeout(() => setVisible(true), 10);
  };

  const meterWidth = useSettingsStore((s) => s.meterWidth);

  const closePanel = (callback?: () => void) => {
    setVisible(false);
    setTimeout(() => {
      setRendered(false);
      setCurrentType(null);
      callback?.();
    }, 200);
  };

  useEffect(() => {
    if (type) {
      if (rendered) {
        pendingRef.current = { type, player };
        closePanel(() => {
          if (pendingRef.current) {
            openPanel(pendingRef.current.type, pendingRef.current.player);
            pendingRef.current = null;
          }
        });
      } else {
        openPanel(type, player);
      }
    } else {
      pendingRef.current = null;
      closePanel();
    }
  }, [type, player]);

  if (!rendered) return null;

  return (
    <div
      style={{ left: meterWidth }}
      className={` min-w-0 fixed top-0  ml-3 h-auto z-50 bg-(--panel-bg) text-white rounded-lg
    transition-all duration-200 ease-in-out 
    ${visible ? "visible  translate-x-0" : "invisible  -translate-x-2"}`}>
      {currentType === "details" && (
        <DetailsPanel
          key={currentPlayer?.id}
          player={currentPlayer}
          onClose={onClose}
          combatTime={combatTime}
          historyIdx={historyIdx}
        />
      )}
      {currentType === "settings" && (
        <SettingsPanel
          onClose={onClose}
          currentVersion={currentVersion}
          updateInfo={updateInfo}
          onCheckUpdate={onCheckUpdate}
        />
      )}
      {currentType === "update" && (
        <UpdatePanel
          updateInfo={updateInfo ?? null}
          checkStatus={checkStatus}
          onClose={onClose}
          downloadState={downloadState}
          onRetryDownload={onRetryDownload}
          onUpdate={onUpdate ?? (() => {})}
          onOpenReleasePage={onOpenReleasePage}
        />
      )}
      {currentType === "history" && (
        <HistoryPanel
          key={currentPlayer?.id}
          onClose={onClose}
          onSelectHistory={onSelectHistory}
          formatBattleTime={formatBattleTime}
        />
      )}
    </div>
  );
};
