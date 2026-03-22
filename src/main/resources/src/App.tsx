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
import { TooltipProvider } from "@/components/ui/tooltip";

// import { DebugConsole } from "./components/DebugConsole";
export default function App() {
  const {
    players,
    targetName,
    isCollapse,
    isInCombat,
    remainHp,
    reset,
    toggleCollapse,
    battleTime,
    formatBattleTime,
    setHistoryData,
  } = useMeter();

  const activePanelRef = useRef<PanelType>(null);
  const selectedRef = useRef<Player | null>(null);
  const { updateInfo, openReleasePage } = useVersionCheck();
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const { meterWidth, onMouseDown, isDragging } = useResizable();
  const rowHeight = useSettingsStore((s) => s.rowHeight);
  const isMinimal = useSettingsStore((s) => s.isMinimal);
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | undefined>(undefined);

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
    setSelectedHistoryIdx(undefined);
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

  const meterCss = `
  rounded-lg transition-all duration-300 text-[rgba(215,215,215)] p-4 
  ${
    isMinimal
      ? "bg-transparent   hover:bg-[rgba(12,22,40,0.4)] "
      : "bg-[rgba(12,22,40,0.4)] border-[rgba(209,213,219,0.3)]"
  }
`;

  const headerCss = `transition-opacity duration-300 ${
    isMinimal ? "opacity-0 group-hover:opacity-100" : "opacity-100"
  }`;
  return (
    <TooltipProvider>
      <div
        style={{ width: "fit-content" }}
        className={`relative  group ${isDragging ? "pointer-events-none" : ""}`}>
        <div
          className={`${meterCss} `}
          style={{ width: meterWidth }}>
          <Header
            className={headerCss}
            reset={handleReset}
            setSettings={handlePanelToggle}
            isCollapse={isCollapse}
            toggleCollapse={handleToggleCollapse}
          />

          {players.length > 0 && !isMinimal && (
            <TargetInfo
              targetName={targetName}
              rowHeight={rowHeight}
              remainHp={remainHp}
            />
          )}
          <MeterList
            players={players}
            selectedId={selected?.id}
            onSelect={handleSelect}
            rowHeight={rowHeight}
          />

          {battleTime && !isMinimal && (
            <CombatTimer
              isInCombat={isInCombat}
              combatTime={formatBattleTime(battleTime)}
            />
          )}

          {!isMinimal && (
            <div
              onMouseDown={onMouseDown}
              className="absolute top-1/2 -translate-y-1/2 -right-3 w-1 h-16 cursor-e-resize flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity group">
              <div className="w-1 h-10 rounded-full bg-white  transition-colors" />
            </div>
          )}
        </div>
        {/* <DebugConsole></DebugConsole> */}
        <div>
          <SidePanel
            type={activePanel}
            player={selected}
            onClose={handleClose}
            combatTime={formatBattleTime(battleTime)}
            updateInfo={updateInfo}
            onUpdate={openReleasePage}
            formatBattleTime={formatBattleTime}
            historyIdx={selectedHistoryIdx}
            onSelectHistory={(idx, report) => {
              setHistoryData(report);
              setSelectedHistoryIdx(idx);
            }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
