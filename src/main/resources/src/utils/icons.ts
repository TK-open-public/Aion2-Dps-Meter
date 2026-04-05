const jobIconModules = import.meta.glob("../assets/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const skillIconModules = import.meta.glob("../assets/skill-icons/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const getJobIconSrc = (job: string | undefined) => {
  const key = `../assets/${job}.png`;
  const result = jobIconModules[key];
  return result;
};

const isSkillCode = (num: number) => num >= 11_000_000 && num <= 19_999_999;
const isBuffCode = (num: number) => num >= 110_000_000 && num <= 190_999_999;

export const getSkillIconSrc = (code: string | number | undefined) => {
  if (code === undefined || code === null) return undefined;

  const num = typeof code === "string" ? parseInt(code, 10) : code;
  if (isNaN(num) || num <= 0) return undefined;  // ← 빈 문자열 "" 방어 추가

  let baseCode: number | undefined;

  if (isSkillCode(num)) {
    baseCode = Math.floor(num / 10_000) * 10_000;
  } else if (isBuffCode(num)) {
    baseCode = Math.floor(num / 100_000) * 10_000;
  }

  if (baseCode === undefined) return undefined;

  return skillIconModules[`../assets/skill-icons/${baseCode}.png`];
};