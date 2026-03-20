import { useState, useCallback, useEffect } from "react";
import { useMeter } from "./hooks/useMeter";

import { MeterList } from "./components/MeterList";
import { useDragWindow } from "./hooks/useDragWindow";

import type { Player } from "./types";
import { Header } from "./components/Header.tsx";
import { TargetInfo } from "./components/TargetInfo";
import { SidePanel } from "./components/SidePanel.tsx";
import type { PanelType } from "./components/SidePanel.tsx";
import { CombatTimer } from "./components/CombatTimer.tsx";
export default function App() {
 
  const {
    players,
    targetName,
    isCollapse,
    reset,
    toggleCollapse,
    battleTime,
    formatBattleTime,
    isInCombat,
  } = useMeter();

  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const handlePanelToggle = useCallback((panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const [selected, setSelected] = useState<Player | null>(null);

  useDragWindow(".drag-area");

  const handleToggleCollapse = useCallback(() => {
    toggleCollapse();
    setActivePanel(null);
    setSelected(null);
  }, [toggleCollapse]);

  const handleReset = useCallback(() => {
    reset();
    setActivePanel(null);
    setSelected(null);
  }, [reset]);

  const handleSelect = useCallback(
    (id: string) => {
      const player = players.find((p) => p.id === id);
      if (!player) return;

      if (activePanel === "details" && selected?.id === player.id) {
        setActivePanel(null);
        return;
      }

      setSelected(player);
      setActivePanel("details");
    },
    [players, activePanel, selected],
  );

  useEffect(() => {
    (window as any).resetDpsUI = () => {
      reset();
      setActivePanel(null);
      setSelected(null);
    };
  }, []);

  return (
    <div
      style={{ width: "fit-content" }}
      className="relative">
      <div className="w-[400px] rounded-lg meter p-4">
        <Header
          reset={handleReset}
          setSettings={handlePanelToggle}
          isCollapse={isCollapse}
          toggleCollapse={handleToggleCollapse}
        />
        <TargetInfo targetName={targetName} />
        <MeterList
          players={players}
          selectedId={selected?.id}
          onSelect={handleSelect}
        />
        {battleTime && (
          <CombatTimer
            isInCombat={isInCombat}
            combatTime={formatBattleTime(battleTime)}
          />
        )}
      </div>
      <SidePanel
        type={activePanel}
        player={selected}
        onClose={() => setActivePanel(null)}
        combatTime={formatBattleTime(battleTime)}
      />
    </div>
  );
}
