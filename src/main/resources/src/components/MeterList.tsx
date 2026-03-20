import type { Player } from "../types";
import { memo } from "react";
import { MeterRow } from "./MeterRow";

interface Props {
  players: Player[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

const getDisplayRows = (players: Player[]): Player[] => {
  const sorted = [...players].sort((a, b) => b.dps - a.dps);
  const top6 = sorted.slice(0, 6);
  const user = sorted.find((p) => p.isUser);

  if (!user) return top6;
  if (top6.some((p) => p.isUser)) return top6;
  return [...top6, user];
};

export const MeterList = memo(({ players, selectedId, onSelect }: Props) => {
  const rows = getDisplayRows(players);
  const topDps = Math.max(...rows.map((p) => p.dps), 1);

  return (
    <div className={`grid gap-1 ${rows.length > 0 ? " " : ""}`}>
      {rows.map((p) => (
        <MeterRow
          key={p.id}
          id={p.id}
          name={p.name}
          job={p.job}
          dps={p.dps}
          contribution={p.damageContribution}
          isUser={p.isUser}
          isSelected={selectedId === p.id}
          onSelect={onSelect}
          topDps={topDps}
        />
      ))}
    </div>
  );
});
