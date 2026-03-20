import type { Player } from "../types";

export interface Skill {
  code: string;
  name: string;
  time: number;
  crit: number;
  parry: number;
  back: number;
  perfect: number;
  double: number;
  dmg: number;

  critPct: number;
  parryPct: number;
  perfectPct: number;
  doublePct: number;
  backPct: number;
}

export interface Details {
  totalDmg: number;
  contributionPct: number;
  totalCritPct: number;
  totalParryPct: number;
  totalBackPct: number;
  totalPerfectPct: number;
  totalDoublePct: number;
  combatTime: string;
  skills: Skill[];
}

export const useDetails = () => {
  const getDetails = async (row: Player, combatTime: string = "00:00"): Promise<Details> => {
    const raw = await window.dpsData?.getBattleDetail?.(row.id);

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

    const pushSkill = (skill: Partial<Skill> & { code: string }) => {
      const dmg = Math.trunc(Number(skill.dmg || 0));
      if (dmg <= 0) return;

      const time = skill.time || 0;
      const crit = skill.crit || 0;
      const back = skill.back || 0;

      totalDmg += dmg;
      totalTimes += time;
      totalCrit += crit;
      totalParry += skill.parry || 0;
      totalBack += back;
      totalPerfect += skill.perfect || 0;
      totalDouble += skill.double || 0;

      skills.push({
        code: skill.code,
        name: skill.name || "",
        time,
        crit,
        parry: skill.parry || 0,
        back,
        perfect: skill.perfect || 0,
        double: skill.double || 0,
        dmg,
        critPct: pctInt(crit, time),
        parryPct: pctInt(skill.parry || 0, time),
        perfectPct: pctInt(skill.perfect || 0, time),
        doublePct: pctInt(skill.double || 0, time),
        backPct: pctInt(back, time),
      });
    };

    for (const [code, value] of Object.entries(detailObj)) {
      if (!value || typeof value !== "object") continue;

      const v = value as Record<string, unknown>;
      const baseName = (v.skillName as string) || `스킬 ${code}`;

      pushSkill({
        code,
        name: baseName,
        time: Number(v.times) || 0,
        dmg: Number(v.damageAmount) || 0,
        crit: Number(v.critTimes) || 0,
        parry: Number(v.parryTimes) || 0,
        back: Number(v.backTimes) || 0,
        perfect: Number(v.perfectTimes) || 0,
        double: Number(v.doubleTimes) || 0,
      });

      if (Number(v.dotDamageAmount) > 0) {
        pushSkill({
          code: `${code}-dot`,
          name: `${baseName} - 지속`,
          time: Number(v.dotTimes) || 0,
          dmg: Number(v.dotDamageAmount) || 0,
        });
      }
    }

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
    };
  };

  return { getDetails };
};
