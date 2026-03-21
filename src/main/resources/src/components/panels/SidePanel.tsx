import { useEffect, useState, useRef } from "react";
import type { Player } from "@/types";
import { DetailsPanel } from "./DetailsPanel";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { UpdatePanel } from "./UpdatePanel";
import type { UpdateInfo, PanelType } from "@/types";
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
  onSelectHistory: (idx: number, report: any) => void; // idx 추가
  historyIdx?: number;
}

export const SidePanel = ({
  type,
  player,
  onClose,
  combatTime,
  updateInfo,
  onSelectHistory,
  onUpdate,
  historyIdx,
  formatBattleTime,
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
      className={` min-w-0 fixed top-0  ml-3 h-auto z-50 bg-[rgba(12,22,40,0.8)] text-white rounded-lg
    transition-all duration-200 ease-in-out
    ${visible ? "visible  translate-x-0" : "invisible  -translate-x-2"}`}>
      {currentType === "details" && (
        <DetailsPanel
          key={currentPlayer?.id}
          player={currentPlayer}
          onClose={onClose}
          combatTime={combatTime}
          historyIdx={historyIdx}
          onReady={() => setTimeout(() => setVisible(true), 10)}
        />
      )}
      {currentType === "settings" && (
        <SettingsPanel
          onClose={onClose}
          onReady={() => setTimeout(() => setVisible(true), 10)}
        />
      )}
      {currentType === "update" && updateInfo && (
        <UpdatePanel
          updateInfo={updateInfo}
          onClose={onClose}
          onUpdate={onUpdate ?? (() => {})}
          onReady={() => setTimeout(() => setVisible(true), 10)}
        />
      )}
      {currentType === "history" && (
        <HistoryPanel
          key={currentPlayer?.id}
          onClose={onClose}
          onReady={() => setTimeout(() => setVisible(true), 10)}
          onSelectHistory={onSelectHistory}
          formatBattleTime={formatBattleTime}
        />
      )}
    </div>
  );
};
