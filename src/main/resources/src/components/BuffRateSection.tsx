"use client";

import { BuffRateBar } from "@/components/BuffRateBar";

type BuffEntry = {
  code: string;
  name: string;
  summary: string;
  effect: string;
  operatingRate: number;
};

interface Props {
  buffOperatingRate: Record<string, BuffEntry> | null | undefined;
  columns?: number;
  playerJob?: string;
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

const PARTY_PREFIXES = new Set([11, 12, 13, 14, 15, 16, 17, 18]);

interface SectionGridProps {
  label: string;
  entries: [string, BuffEntry][];
  gridClass: string;
}
const getCodePrefix = (id: string): number | null => {
  const num = parseInt(id, 10);
  if (isNaN(num)) return null;
  return Math.floor(num / 10_000_000);
};

const categorize = (
  entries: [string, BuffEntry][],
  myPrefix: number | null,
): {
  mine: [string, BuffEntry][];
  party: [string, BuffEntry][];
  other: [string, BuffEntry][];
} => {
  const mine: [string, BuffEntry][] = [];
  const party: [string, BuffEntry][] = [];
  const other: [string, BuffEntry][] = [];

  for (const entry of entries) {
    const prefix = getCodePrefix(entry[0]);
    if (prefix === null) {
      other.push(entry);
    } else if (myPrefix !== null && prefix === myPrefix) {
      mine.push(entry);
    } else if (PARTY_PREFIXES.has(prefix)) {
      party.push(entry);
    } else {
      other.push(entry);
    }
  }

  return { mine, party, other };
};
const SectionGrid = ({ label, entries, gridClass }: SectionGridProps) => {
  if (entries.length === 0) return null;
  return (
    <div>
      <p className="text-xs text-white/40 font-semibold px-1 pt-2 pb-1 uppercase tracking-wider">
        {label}
        <span className="ml-1.5 opacity-60">({entries.length})</span>
      </p>
      <div className={`grid ${gridClass} gap-x-4 gap-y-0.5`}>
        {entries
          .sort((a, b) => b[1].operatingRate - a[1].operatingRate)
          .map(([id, val]) => (
            <BuffRateBar
              key={id}
              id={id}
              code={val.code}
              rate={val.operatingRate}
              info={{ name: val.name, summary: val.summary, effect: val.effect }}
            />
          ))}
      </div>
    </div>
  );
};
export const BuffRateSection = ({ buffOperatingRate, columns = 1, playerJob }: Props) => {
  const entries: [string, BuffEntry][] = buffOperatingRate ? Object.entries(buffOperatingRate) : [];
  if (entries.length === 0) return null;

  const gridClass =
    columns >= 4
      ? "grid-cols-4"
      : columns >= 3
        ? "grid-cols-3"
        : columns >= 2
          ? "grid-cols-2"
          : "grid-cols-1";

  const myPrefix = playerJob ? (JOB_PREFIX_MAP[playerJob] ?? null) : null;
  const { mine, party, other } = categorize(entries, myPrefix);

  return (
    <div className="mb-3 rounded-lg overflow-hidden">
      <div className="px-4 py-2 space-y-1">
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
