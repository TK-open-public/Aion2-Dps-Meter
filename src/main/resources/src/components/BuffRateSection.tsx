"use client";

import { BuffRateBar } from "@/components/BuffRateBar";
import type { BuffEntry } from "@/types";

interface Props {
  buffOperatingRate: BuffEntry[] | null | undefined;
  columns?: number;
  playerJob?: string;
  playerId: number;
}
const JOB_PREFIX_MAP: Record<string, number> = {
  검성: 11,
  수호성: 12,
  살성: 13,
  궁성: 14,
  마도성: 15,
  정령성: 16,
  치유성: 17,
  호법성: 18,
};

interface SectionGridProps {
  label: string;
  entries: BuffEntry[];
  gridClass: string;
}
const getCodePrefix = (id: string): number | null => {
  const num = parseInt(id, 10);
  if (isNaN(num)) return null;
  return Math.floor(num / 10_000_000);
};

const categorize = (
  entries: BuffEntry[],
  myActorId: number,
  myPrefix: number | null,
): {
  mine: BuffEntry[];
  party: BuffEntry[];
  other: BuffEntry[];
} => {
  const mine: BuffEntry[] = [];
  const party: BuffEntry[] = [];
  const other: BuffEntry[] = [];

  for (const entry of entries) {
    if (Number(entry.actorId) === Number(myActorId)) {
      const prefix = getCodePrefix(entry.code);
      if (myPrefix !== null && prefix === myPrefix) {
        mine.push(entry);
      } else {
        other.push(entry);
      }
    } else {
      party.push(entry);
    }
  }

  return { mine, party, other };
};

const SectionGrid = ({ label, entries, gridClass }: SectionGridProps) => {
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="mb-3 text-xs text-white/40 font-semibold px-1 pt-2 pb-1 ">
        {label}
        <span className="ml-1.5 opacity-60">({entries.length})</span>
      </div>
      <div className={`grid ${gridClass} gap-x-4 gap-y-0.5`}>
        {entries
          .sort((a, b) => b.operatingRate - a.operatingRate)
          .map((val) => (
            <BuffRateBar
              key={val.code}
              id={val.code}
              code={val.code}
              rate={val.operatingRate}
              info={{ name: val.name, summary: val.summary, effect: val.effect }}
            />
          ))}
      </div>
    </div>
  );
};
export const BuffRateSection = ({ buffOperatingRate, playerId, columns = 1, playerJob }: Props) => {
  const entries: BuffEntry[] = buffOperatingRate ?? [];
  if (entries.length === 0) return null;
  const myPrefix = playerJob ? (JOB_PREFIX_MAP[playerJob] ?? null) : null;
  const { mine, party, other } = categorize(entries, playerId, myPrefix);

  const gridClass =
    columns >= 4
      ? "grid-cols-4"
      : columns >= 3
        ? "grid-cols-3"
        : columns >= 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="px-4 pt-2 space-y-2">
        <SectionGrid
          label="내 버프"
          entries={mine}
          gridClass={gridClass}
        />
        <SectionGrid
          label="파티원 버프"
          entries={party}
          gridClass={gridClass}
        />
        <SectionGrid
          label="그 외"
          entries={other}
          gridClass={gridClass}
        />
      </div>
    </div>
  );
};
