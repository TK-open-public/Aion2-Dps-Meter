import { useCallback, useEffect, useRef, useState } from "react";
import type { Player } from "../types";
import { parseCombatData } from "../utils/parser";
// import { useDebugStore } from "../stores/debugStore";

const POLL_MS = 300;

export const useMeter = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [targetName, setTargetName] = useState<string>("");
  const [remainHp, setRemainHp] = useState<string | number>(0);
  const [isCollapse, setIsCollapse] = useState(false);
  const [isInCombat, setIsInCombat] = useState(false);

  const [battleTime, setBattleTime] = useState<number | null>(null);
  // const addLog = useDebugStore((s) => s.addLog);
  const isCollapseRef = useRef(false);
  const lastBattleTimeRef = useRef<number | null>(null);
  const combatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastJsonRef = useRef<string | null>(null);
  const snapshotRef = useRef<Player[] | null>(null);
  const resetPendingRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatBattleTime = (ms: number | null | undefined) => {
    if (!ms || !Number.isFinite(ms)) return "00:00";

    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };
  const setPlayersIfChanged = (newRows: Player[]) => {
    setPlayers((prev) => {
      const isSame =
        prev.length === newRows.length &&
        prev.every(
          (p, i) =>
            p.id === newRows[i].id &&
            p.dps === newRows[i].dps &&
            p.damageContribution === newRows[i].damageContribution,
        );
      return isSame ? prev : newRows;
    });
  };

  const fetchDps = () => {
    if (isCollapseRef.current) return;
    const raw = window.javaBridge?.getDpsData?.();
    if (typeof raw !== "string") return;
    if (raw === lastJsonRef.current) {
      return;
    }
    //  else {
    //   addLog(`raw${raw}`);
    // }

    lastJsonRef.current = raw;

    const parsed = JSON.parse(raw);
    const { players: rows, targetName, remainHp } = parseCombatData(parsed);

    if (resetPendingRef.current) {
      if (rows.length > 0) {
        return;
      } else {
        resetPendingRef.current = false;
      }
    }

    const battleStart = parsed.battleStart ?? null;
    const battleEnd = parsed.battleEnd ?? null;
    const battleTime = battleStart && battleEnd ? battleEnd - battleStart : null;

    if (battleEnd !== lastBattleTimeRef.current) {
      lastBattleTimeRef.current = battleEnd;
      setIsInCombat(true);

      if (combatTimerRef.current) clearTimeout(combatTimerRef.current);
      combatTimerRef.current = setTimeout(() => {
        setIsInCombat(false);
      }, 1000);
    }

    let rowsToRender = rows;

    if (rows.length === 0) {
      if (snapshotRef.current) {
        rowsToRender = snapshotRef.current;
      } else {
        return;
      }
    } else {
      snapshotRef.current = rows;
    }

    setPlayersIfChanged(rowsToRender);
    setTargetName(targetName);
    setRemainHp(remainHp);
    setBattleTime(battleTime);
  };
  const startPolling = () => {
    if (pollTimerRef.current) return;

    pollTimerRef.current = setInterval(fetchDps, POLL_MS);
  };

  const stopPolling = () => {
    if (!pollTimerRef.current) return;

    clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
  };

  const reset = () => {
    resetPendingRef.current = true;

    snapshotRef.current = null;
    lastJsonRef.current = null;
    lastBattleTimeRef.current = null;

    setPlayers([]);
    setTargetName("");
    setRemainHp(0);
    setIsInCombat(false);
    setBattleTime(null);

    if (combatTimerRef.current) {
      clearTimeout(combatTimerRef.current);
      combatTimerRef.current = null;
    }
  };

  const toggleCollapse = () => {
    const next = !isCollapseRef.current;
    isCollapseRef.current = next;
    setIsCollapse(next);

    if (next) {
      stopPolling();
      reset();
      window?.javaBridge?.resetDps?.();
    } else {
      startPolling();
      fetchDps();
    }
  };
  const setHistoryData = useCallback((report: any) => {
    const { players: rows, targetName } = parseCombatData(report);
    const battleTime = (report.battleEnd ?? 0) - (report.battleStart ?? 0);
    setPlayersIfChanged(rows);
    setTargetName(targetName);
    setBattleTime(battleTime);
    setIsInCombat(false);
  }, []);

  useEffect(() => {
    startPolling();
    fetchDps();

    return () => stopPolling();
  }, []);

  return {
    players,
    targetName,
    isCollapse,
    battleTime,
    isInCombat,
    remainHp,
    formatBattleTime,
    reset,
    toggleCollapse,
    setHistoryData,
  };
};
