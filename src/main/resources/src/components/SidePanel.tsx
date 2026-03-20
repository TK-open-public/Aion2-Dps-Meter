import { useEffect, useState, useRef } from "react";
import type { Player } from "@/types";
import { DetailsPanel } from "./DetailsPanel";
import { SettingsPanel } from "./SettingsPanel.tsx";

export type PanelType = "details" | "settings" | "history" | null;

interface SidePanelProps {
  type: PanelType;
  player: Player | null;
  onClose: () => void;
  combatTime: string;
}

export const SidePanel = ({ type, player, onClose, combatTime }: SidePanelProps) => {
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
      className={` min-w-0 fixed top-0 left-100 ml-2 h-auto z-50 bg-[rgb(12,22,40)] text-white rounded-lg
    transition-all duration-200 ease-in-out
    ${visible ? "visible  translate-x-0" : "invisible  -translate-x-2"}`}>
      {currentType === "details" && (
        <DetailsPanel
          key={currentPlayer?.id}
          player={currentPlayer}
          onClose={onClose}
          combatTime={combatTime}
          onReady={() => setTimeout(() => setVisible(true), 10)}
        />
      )}
      {currentType === "settings" && (
        <SettingsPanel
          onClose={onClose}
          onReady={() => setTimeout(() => setVisible(true), 10)}
        />
      )}
    </div>
  );
};
