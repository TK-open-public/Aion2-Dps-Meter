import { memo, useMemo, useRef } from "react";
import type { Player } from "@/types";
import { MeterRow } from "./MeterRow";

const MAX_CACHE = 32;

interface Props {
  players: Player[];
  selectedId?: number;
  onSelect: (id: number) => void;
  rowHeight: number;
}

const getDisplayRows = (players: Player[]): Player[] => {
  const sorted = [...players].sort((a, b) => b.dps - a.dps);
  const top8 = sorted.slice(0, 8);
  const user = sorted.find((p) => p.isUser);

  if (!user) return top8;
  if (top8.some((p) => p.isUser)) return top8;
  return [...top8, user];
};

export const MeterList = memo(({ players, selectedId, onSelect, rowHeight }: Props) => {
  const cachedPlayersRef = useRef<Map<number, Player>>(new Map());
  const prevRowsRef = useRef<Player[]>([]);

  const rows = useMemo(() => {
    const next = getDisplayRows(players);

    const isSame =
      next.length === prevRowsRef.current.length &&
      next.every((p, i) => {
        const prev = prevRowsRef.current[i];
        return (
          prev.id === p.id && prev.dps === p.dps && prev.damageContribution === p.damageContribution
        );
      });

    if (isSame) return prevRowsRef.current;
    prevRowsRef.current = next;
    return next;
  }, [players]);
  const rowMap = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const topDps = useMemo(() => Math.max(...rows.map((p) => p.dps), 1), [rows]);

  rows.forEach((p) => cachedPlayersRef.current.set(p.id, p));

  if (cachedPlayersRef.current.size > MAX_CACHE) {
    const visibleIds = new Set(rows.map((p) => p.id));
    const candidates = Array.from(cachedPlayersRef.current.keys()).filter(
      (id) => !visibleIds.has(id),
    );
    candidates.slice(0, cachedPlayersRef.current.size - MAX_CACHE).forEach((id) => {
      cachedPlayersRef.current.delete(id);
    });
  }

  const visibleIds = new Set(rows.map((p) => p.id));

  if (rows.length === 0) {
    return (
      <div className=" w-full ">
        <div
          style={{ height: rowHeight }}
          className="px-2 rounded-sm bg-black/30 h-full flex items-center gap-3">
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: Math.round(rowHeight * 0.7), height: Math.round(rowHeight * 0.7) }}>
            <div
              className="rounded-full bg-white/10"
              style={{ width: Math.round(rowHeight * 0.5), height: Math.round(rowHeight * 0.5) }}
            />
          </div>
          <span
            className="font-bold"
            style={{
              fontSize: `${Math.max(12, Math.round(rowHeight * 0.4))}px`,
            }}>
            전투 대기 중
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-1">
      {Array.from(cachedPlayersRef.current.values())
        .sort((a, b) => {
          const aVisible = visibleIds.has(a.id);
          const bVisible = visibleIds.has(b.id);
          if (aVisible && !bVisible) return -1;
          if (!aVisible && bVisible) return 1;
          return (rowMap.get(b.id)?.dps ?? 0) - (rowMap.get(a.id)?.dps ?? 0);
        })
        .map((cached) => {
          const isVisible = visibleIds.has(cached.id);
          const current = isVisible ? rows.find((r) => r.id === cached.id)! : cached;

          return (
            <div
              className="overflow-hidden"
              key={cached.id}
              style={{ display: isVisible ? "block" : "none" }}>
              <MeterRow
                id={current.id}
                name={current.name}
                job={current.job}
                server={current.server}
                rowHeight={rowHeight}
                dps={current.dps}
                amount={current.amount}
                contribution={current.damageContribution}
                isUser={current.isUser}
                isSelected={selectedId === current.id}
                onSelect={onSelect}
                topDps={topDps}
              />
            </div>
          );
        })}
    </div>
  );
});
