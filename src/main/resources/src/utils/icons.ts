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
const normalizeSkillName = (name: string) => name.split("-")[0].trim();

const nameToFilename = (name: string) =>
  name
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();

const skillIconKeys = Object.keys(skillIconModules);

export const getSkillIconSrc = (name: string | undefined) => {
  if (!name) return undefined;

  const normalized = normalizeSkillName(name);
  const filename = nameToFilename(normalized);

  const exact = skillIconModules[`../assets/skill-icons/${filename}.png`];
  if (exact) return exact;

  const beforeColon = normalized.split(":")[0].trim();
  if (beforeColon !== normalized) {
    const fallback = skillIconModules[`../assets/skill-icons/${nameToFilename(beforeColon)}.png`];
    if (fallback) return fallback;
  }

  const partialFilename = nameToFilename(beforeColon || normalized);
  const matched = skillIconKeys.find((key) => key.endsWith(`_${partialFilename}.png`));
  if (matched) return skillIconModules[matched];

  return undefined;
};
