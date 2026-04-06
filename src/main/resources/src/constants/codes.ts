export const JOB_PREFIX_MAP: Record<string, number> = {
  검성: 11,
  수호성: 12,
  살성: 13,
  궁성: 14,
  마도성: 15,
  정령성: 16,
  치유성: 17,
  호법성: 18,
};

export interface SkillInfo {
  code: number;
  name: string;
}

export const SKILL_DATA: SkillInfo[] = [
  // 검성 (11)
  {
    code: 11800000,
    name: "살기 파열",
  },
  {
    code: 11250000,
    name: "지켈의 축복",
  },
  {
    code: 11400000,
    name: "돌격 자세",
  },
  // 수호성 (12)
  {
    code: 12780000,
    name: "격앙",
  },
  {
    code: 12120000,
    name: "도발",
  },
  // 살성 (13)
  {
    code: 13310000,
    name: "환영 분신",
  },
  {
    code: 13390000,
    name: "신속의 계약",
  },
  {
    code: 13300000,
    name: "트리니엘의 비수",
  },

  // 궁성 (14)
  {
    code: 14310000,
    name: "바이젤의 권능",
  },
  {
    code: 14220000,
    name: "축복의 활",
  },
  {
    code: 14380000,
    name: "지원 사격",
  },

  // 마도성 (15)
  {
    code: 15320000,
    name: "지연 폭발",
  },
  {
    code: 15400000,
    name: "원소 강화",
  },
  {
    code: 15390000,
    name: "불의 장벽",
  },
  // 정령성 (16)
  {
    code: 16370000,
    name: "불길의 축복",
  },
  {
    code: 16250000,
    name: "고대의 정령",
  },
  {
    code: 16190000,
    name: "정령의 가호",
  },
  {
    code: 16150000,
    name: "협공: 부식",
  },
  {
    code: 16220000,
    name: "저주의 구름",
  },

  // 치유성 (17)
  {
    code: 17410000,
    name: "보호의 빛",
  },
  {
    code: 17400000,
    name: "대지의 징벌",
  },
  {
    code: 17390000,
    name: "소환 부활",
  },
  {
    code: 17780000,
    name: "대지의 은총",
  },
  {
    code: 17160000,
    name: "치유의 기운",
  },
  {
    code: 17420000,
    name: "유스티엘의 권능",
  },
  {
    code: 17290000,
    name: "면죄",
  },

  // 호법성 (18)
  {
    code: 18190000,
    name: "불패의 진언",
  },
  {
    code: 18160000,
    name: "질주의 진언",
  },
  {
    code: 18250000,
    name: "질풍의 권능",
  },
  {
    code: 18170000,
    name: "쾌유의 손길",
  },
  {
    code: 18440000,
    name: "결계의 주문",
  },
  {
    code: 18780000,
    name: "대지의 약속",
  },
];

export const SKILL_MAP = new Map<number, SkillInfo>(SKILL_DATA.map((s) => [s.code, s]));

export const ALL_SKILL_CODES = SKILL_DATA.map((s) => s.code);
export const SKILL_ORDER_MAP = new Map<number, number>(
  ALL_SKILL_CODES.map((code, idx) => [code, idx]),
);
export const DEFAULT_VISIBLE_SKILL_CODES = ALL_SKILL_CODES;

export const GROUPED_BY_JOB = Object.entries(JOB_PREFIX_MAP).map(([job, prefix]) => ({
  job,

  skills: ALL_SKILL_CODES.filter((code) => Math.floor(code / 1_000_000) === prefix),
}));

export const getSkillName = (code: number | string): string | undefined =>
  SKILL_MAP.get(Number(code))?.name;
