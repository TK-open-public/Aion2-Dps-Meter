const iconModules = import.meta.glob("../assets/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const getJobIconSrc = (job: string | undefined) => iconModules[`../assets/${job}.png`];
