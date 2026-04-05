import type { Player, Skill, Details } from "@/types";
// import { useDebugStore } from "../stores/debugStore";

export const useDetails = () => {
  const getDetails = async (
    row: Player,
    combatTime: string = "00:00",
    historyIdx?: number,
  ): Promise<Details> => {
    // const addLog = useDebugStore.getState().addLog;

    const raw =
      historyIdx !== undefined
        ? await window.javaBridge?.getBattleDetailFromList?.(historyIdx, Number(row.id))
        : await window.javaBridge?.getBattleDetail?.(Number(row.id));
    const buffRaw =
      historyIdx !== undefined
        ? await window.javaBridge?.getBuffOperatingRate?.(historyIdx, Number(row.id))
        : await window.javaBridge?.getLiveBuffOperatingRate?.(Number(row.id));
    // addLog(`${historyIdx ? `히스토리 디테일 ${raw}` : `일반 detail rowID${row.id} ${raw}`}`);
    // addLog(`${historyIdx ? ` ${buffRaw}` : `일반 detail rowID${row.id} ${buffRaw}`}`);
    let detailObj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!detailObj || typeof detailObj !== "object") detailObj = {};

    const skills: Skill[] = [];
    let totalDmg = 0;
    let totalTimes = 0;
    let totalCrit = 0;
    let totalParry = 0;
    let totalBack = 0;
    let totalPerfect = 0;
    let totalDouble = 0;

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);
    const pctInt = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

    const pushSkill = (
      skill: {
        code: string;
        name?: string;
        time?: number;
        dmg?: number;
        crit?: number;
        shardTimes?: number;
        parry?: number;
        back?: number;
        perfect?: number;
        double?: number;
      },
      isDot = false,
    ) => {
      const dmg = Math.trunc(Number(skill.dmg || 0));
      if (dmg <= 0) return;

      const time = skill.time || 0;
      const crit = skill.crit ?? 0;
      const parry = skill.parry ?? 0;
      const back = skill.back ?? 0;
      const perfect = skill.perfect ?? 0;
      const double_ = skill.double ?? 0;
      const shardTimes = skill.shardTimes ?? 0;
      totalDmg += dmg;
      if (!isDot) {
        totalTimes += time;
        totalCrit += crit;
        totalParry += parry;
        totalBack += back;
        totalPerfect += perfect;
        totalDouble += double_;
      }

      skills.push({
        code: skill.code,
        name: skill.name || "",
        time,
        crit,
        parry,
        back,
        perfect,
        shardTimes,
        double: double_,
        dmg,
        critPct: isDot ? "-" : pctInt(crit, time),
        parryPct: isDot ? "-" : pctInt(parry, time),
        perfectPct: isDot ? "-" : pctInt(perfect, time),
        doublePct: isDot ? "-" : pctInt(double_, time),
        backPct: isDot ? "-" : pctInt(back, time),
      });
    };

    for (const [code, value] of Object.entries(detailObj)) {
      if (!value || typeof value !== "object") continue;

      const v = value as Record<string, unknown>;
      const name = v.name as string;

      pushSkill({
        code,
        name: name,
        time: Number(v.times) || 0,
        dmg: Number(v.damageAmount) || 0,
        shardTimes: Number(v.shardTimes) || 0,
        crit: Number(v.critTimes) || 0,
        parry: Number(v.parryTimes) || 0,
        back: Number(v.backTimes) || 0,
        perfect: Number(v.perfectTimes) || 0,
        double: Number(v.doubleTimes) || 0,
      });

      if (Number(v.dotDamageAmount) > 0) {
        pushSkill(
          {
            code: code,
            name: `${name} - 지속`,
            time: Number(v.dotTimes) || 0,
            dmg: Number(v.dotDamageAmount) || 0,
          },
          true,
        );
      }
    }
    const buffOperatingRate = typeof buffRaw === "string" ? JSON.parse(buffRaw) : (buffRaw ?? null);

    return {
      totalDmg,
      contributionPct: row.damageContribution,
      totalCritPct: pct(totalCrit, totalTimes),
      totalParryPct: pct(totalParry, totalTimes),
      totalBackPct: pct(totalBack, totalTimes),
      totalPerfectPct: pct(totalPerfect, totalTimes),
      totalDoublePct: pct(totalDouble, totalTimes),
      combatTime,
      skills: skills.sort((a, b) => b.dmg - a.dmg),
      buffOperatingRate,
    };
  };

  return { getDetails };
};
