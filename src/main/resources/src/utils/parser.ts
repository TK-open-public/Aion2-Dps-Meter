import type { Player } from "@/types";

interface Contributor {
  id: number;
  nickname: string;
  job: string;
  isExecutor?: boolean;
  server: number;
}
interface InformationValue {
  amount: number;
  dps: number;
  contribution: number;
}
interface Target {
  id: number;
  remainHp: string;
  mob?: {
    code: number;
    name: string;
    boss: boolean;
  };
}
interface RawCombatData {
  contributors: Contributor[];
  battleStart: number;
  battleEnd: number;
  information: Record<string, InformationValue>;
  target?: Target;
}

const SERVER_NAMES: Record<string, string> = {
  "1001": "시엘",
  "1002": "네자칸",
  "1003": "바이젤",
  "1004": "카이시넬",
  "1005": "유스티엘",
  "1006": "아리엘",
  "1007": "프레기온",
  "1008": "메스람타에다",
  "1009": "히타니에",
  "1010": "나니아",
  "1011": "타하바타",
  "1012": "루터스",
  "1013": "페르노스",
  "1014": "다미누",
  "1015": "카사카",
  "1016": "바카르마",
  "1017": "챈가룽",
  "1018": "코치룽",
  "1019": "이슈타르",
  "1020": "티아마트",
  "1021": "포에타",
  "2001": "이스라펠",
  "2002": "지켈",
  "2003": "트리니엘",
  "2004": "루미엘",
  "2005": "마르쿠탄",
  "2006": "아스펠",
  "2007": "에레슈키갈",
  "2008": "브리트라",
  "2009": "네몬",
  "2010": "하달",
  "2011": "루드라",
  "2012": "울고른",
  "2013": "무닌",
  "2014": "오다르",
  "2015": "젠카카",
  "2016": "크로메데",
  "2017": "콰이링",
  "2018": "바바룽",
  "2019": "파프니르",
  "2020": "인드나흐",
  "2021": "이스할겐",
};

const getServerLabel = (server?: number) => {
  if (!server) return "";
  const name = SERVER_NAMES[String(server)];
  if (!name) return "";
  return name.slice(0, 2);
};

export function parseCombatData(raw: unknown): {
  players: Player[];
  targetName: string;
  remainHp: string | number;
} {
  const data = raw as RawCombatData;
  if (!data?.contributors || !data?.information)
    return { players: [], targetName: "", remainHp: 0 };

  const rows: Player[] = [];

  for (const contributor of data.contributors) {
    const id = String(contributor.id);
    const info = data.information[id];
    if (!info) continue;

    const dps = Math.trunc(Number(info.dps));
    const amount = Number(info.amount);
    const damageContribution = Math.round(Number(info.contribution) * 10) / 10;
    if (!Number.isFinite(dps)) continue;

    const serverLabel = getServerLabel(contributor.server);
    const name = serverLabel
      ? `${contributor.nickname || id}[${serverLabel}]`
      : contributor.nickname || id;

    rows.push({
      id: Number(id) || 0,
      name,
      job: contributor.job ?? "",
      server: contributor.server,
      dps,
      amount,
      damageContribution,
      isUser: contributor.isExecutor === true,
    });
  }

  const targetName = data.target?.mob?.name ?? "";
  const remainHp = data.target?.remainHp ?? 0;
  return { players: rows.sort((a, b) => b.dps - a.dps), targetName, remainHp };
}
