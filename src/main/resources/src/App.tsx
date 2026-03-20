import { useState, useCallback, useEffect, useRef } from "react";
import { useMeter } from "./hooks/useMeter";
import type { Player } from "./types";
import type { PanelType } from "./types";
import { MeterList } from "./components/MeterList";
import { useDragWindow } from "./hooks/useDragWindow";
import { Header } from "@/components/Header.tsx";
import { TargetInfo } from "@/components/TargetInfo";
import { SidePanel } from "@/components/panels/SidePanel.tsx";
import { CombatTimer } from "@/components/CombatTimer.tsx";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { useResizable } from "@/hooks/useResizable";
import { useSettingsStore } from "@/stores/useSettingsStore";

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

  const activePanelRef = useRef<PanelType>(null);
  const selectedRef = useRef<Player | null>(null);
  const { updateInfo, openReleasePage } = useVersionCheck();
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const { meterWidth, onMouseDown } = useResizable();
  const rowHeight = useSettingsStore((s) => s.rowHeight);

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
      if (activePanelRef.current === "details" && selectedRef.current?.id === player.id) {
        setActivePanel(null);
        return;
      }
      setSelected(player);
      setActivePanel("details");
    },
    [players],
  );

  const handleClose = useCallback(() => {
    setActivePanel(null);
  }, []);

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    (window as any).resetDpsUI = () => {
      reset();
      setActivePanel(null);
      setSelected(null);
    };
  }, [reset]);

  useEffect(() => {
    if (updateInfo) setActivePanel("update");
  }, [updateInfo]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleClose]);

  return (
    <div
      style={{ width: "fit-content" }}
      className="relative">
      <div
        className="rounded-lg meter p-4"
        style={{ width: meterWidth }}>
        <Header
          reset={handleReset}
          setSettings={handlePanelToggle}
          isCollapse={isCollapse}
          toggleCollapse={handleToggleCollapse}
        />
        {players.length > 0 && (
          <TargetInfo
            targetName={targetName}
            rowHeight={rowHeight}
          />
        )}
        <MeterList
          players={players}
          selectedId={selected?.id}
          onSelect={handleSelect}
          rowHeight={rowHeight}
        />
        {battleTime && (
          <CombatTimer
            isInCombat={isInCombat}
            combatTime={formatBattleTime(battleTime)}
          />
        )}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="absolute top-1/2 -translate-y-1/2 -right-3 w-3 h-16 cursor-e-resize flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity group">
        <div className="w-1 h-10 rounded-full bg-black  transition-colors" />
      </div>
      <SidePanel
        type={activePanel}
        player={selected}
        onClose={handleClose}
        combatTime={formatBattleTime(battleTime)}
        updateInfo={updateInfo}
        onUpdate={openReleasePage}
      />
    </div>
  );
}
