import { useState, useCallback, useEffect, useRef } from "react";
import { useMeter } from "./hooks/useMeter";
import type { Player, PanelType } from "@/types";
import { MeterList } from "./components/MeterList";
import { useDragWindow } from "./hooks/useDragWindow";
import { Header } from "@/components/Header.tsx";
import { TargetInfo } from "@/components/TargetInfo";
import { SidePanel } from "@/components/panels/SidePanel.tsx";
import { CombatTimer } from "@/components/CombatTimer.tsx";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { useResizable } from "@/hooks/useResizable";
import { useSettingsStore } from "@/stores/useSettingsStore";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { useJoinRequestStore } from "@/stores/useJoinRequestStore";
import { JoinRequestPanel } from "@/components/joinPanel/JoinRequestPanel";
import { cn } from "@/lib/utils";

import { DebugConsole } from "./components/DebugConsole";
export default function App() {
  const {
    players,
    targetName,
    // isCollapse,
    isInCombat,
    remainHp,
    reset,
    // toggleCollapse,
    battleTime,
    formatBattleTime,
    setHistoryData,
  } = useMeter();

  const activePanelRef = useRef<PanelType>(null);
  const selectedRef = useRef<Player | null>(null);
  const {
    updateInfo,
    currentVersion,
    openReleasePage,
    downloadState,
    retryDownload,
    startUpdate,
    checkUpdate,
    checkStatus,
  } = useVersionCheck();
  const { addRequest, removeRequest, clearAll, refuseRequest } = useJoinRequestStore();

  const headerPosition = useSettingsStore((s) => s.headerPosition);
  const { windowX, windowY } = useSettingsStore();
  const isLoaded = useSettingsStore((s) => s.isLoaded);

  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const { meterWidth, onMouseDown, isDragging } = useResizable();
  const rowHeight = useSettingsStore((s) => s.rowHeight);
  const isMinimal = useSettingsStore((s) => s.isMinimal);
  const showCombatTimerInMinimal = useSettingsStore((s) => s.showCombatTimerInMinimal);
  const showTargetInfoInMinimal = useSettingsStore((s) => s.showTargetInfoInMinimal);

  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | undefined>(undefined);

  const handlePanelToggle = useCallback((panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);
  const [selected, setSelected] = useState<Player | null>(null);

  const { wasDraggingRef } = useDragWindow(".drag-area");

  // const handleToggleCollapse = useCallback(() => {
  //   toggleCollapse();
  //   setActivePanel(null);
  //   setSelected(null);
  // }, [toggleCollapse]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedHistoryIdx(undefined);
    setActivePanel(null);
    setSelected(null);
  }, [reset]);

  const playersRef = useRef<Player[]>([]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const handleSelect = useCallback((id: number) => {
    if (wasDraggingRef.current) return;
    const player = playersRef.current.find((p) => p.id === id);
    if (!player) return;
    if (activePanelRef.current === "details" && selectedRef.current?.id === player.id) {
      setActivePanel(null);
      return;
    }
    setSelected(player);
    setActivePanel("details");
  }, []);
  const handleClose = useCallback(() => {
    setActivePanel(null);
  }, []);
  const handleCheckUpdate = useCallback(() => {
    checkUpdate();
    handlePanelToggle("update");
  }, [checkUpdate, handlePanelToggle]);

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!isLoaded) return;
    (window as any).javaBridge?.moveWindow(windowX, windowY);
  }, [isLoaded]);

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

  useEffect(() => {
    (window as any).strongReset = () => {
      reset();
      setActivePanel(null);
      setSelected(null);
    };
  }, [reset]);

  useEffect(() => {
    if (isInCombat) {
      setSelectedHistoryIdx(undefined);
    }
  }, [isInCombat]);

  useEffect(() => {
    (window as any).onJoinRequest = (data: any) => {
      addRequest(data);
    };
    (window as any).onJoinRequestRemove = (id: number) => {
      removeRequest(id);
    };
    (window as any).onExitPartyUI = () => {
      clearAll();
    };
    (window as any).onRefuseJoinRequest = () => {
      refuseRequest();
    };
  }, []);
  const meterClass = cn(
    "rounded-lg transition-color duration-300 text-[rgba(215,215,215)] py-2 px-3",
    isMinimal
      ? "bg-transparent group-hover/app:bg-[rgba(12,22,40,0.4)]"
      : "bg-[rgba(12,22,40,0.4)]",
  );

  const headerClass = cn(
    "transition-opacity duration-300",
    isMinimal && "opacity-0 group-hover/app:opacity-100",
  );

  const rootClass = cn(
    "drag-area cursor-move select-none relative group/app",
    isDragging && "pointer-events-none",
  );
  const handleSelectHistory = useCallback(
    (idx: number, report: any) => {
      setHistoryData(report);
      setSelectedHistoryIdx(idx);
    },
    [setHistoryData],
  );
  return (
    // <TooltipProvider>
    <div
      style={{ width: "fit-content" }}
      className={rootClass}>
      <div
        className={meterClass}
        style={{ width: meterWidth }}>
        {headerPosition === "top" && (
          <div className=" mb-2">
            <Header
              className={headerClass}
              reset={handleReset}
              setSettings={handlePanelToggle}
              // isCollapse={isCollapse}
              // toggleCollapse={handleToggleCollapse}
            />
          </div>
        )}
        {players.length > 0 && (!isMinimal || showTargetInfoInMinimal) && (
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

        {battleTime && (!isMinimal || showCombatTimerInMinimal) && (
          <CombatTimer
            isInCombat={isInCombat}
            combatTime={formatBattleTime(battleTime)}
          />
        )}
        {headerPosition === "bottom" && (
          <div className=" mt-2">
            <Header
              className={headerClass}
              reset={handleReset}
              setSettings={handlePanelToggle}
              // isCollapse={isCollapse}
              // toggleCollapse={handleToggleCollapse}
            />
          </div>
        )}
        {!isMinimal && (
          <div
            onMouseDown={onMouseDown}
            className="resizeHandle absolute top-1/2 -translate-y-1/2 -right-3 w-1 h-16 cursor-e-resize flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity group">
            <div className="w-1 h-10 rounded-full bg-white  transition-colors" />
          </div>
        )}
      </div>
      <div className="group/join">
        <JoinRequestPanel
          isMinimal={isMinimal}
          maxWidth={meterWidth}
        />
      </div>
      <DebugConsole></DebugConsole>
      <div>
        <SidePanel
          type={activePanel}
          player={selected}
          onClose={handleClose}
          combatTime={formatBattleTime(battleTime)}
          updateInfo={updateInfo}
          onUpdate={startUpdate}
          checkStatus={checkStatus}
          downloadState={downloadState}
          onRetryDownload={retryDownload}
          formatBattleTime={formatBattleTime}
          historyIdx={selectedHistoryIdx}
          onOpenReleasePage={openReleasePage}
          onSelectHistory={handleSelectHistory}
          currentVersion={currentVersion ?? undefined}
          onCheckUpdate={handleCheckUpdate}
        />
      </div>
    </div>
    // </TooltipProvider>
  );
}
