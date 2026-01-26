let USER_NAME = "-------";

function buildRowsFromPayload(raw) {
  const payload = JSON.parse(raw);
  const targetName = typeof payload?.targetName === "string" ? payload.targetName : "";

  const mapObj = payload?.map && typeof payload.map === "object" ? payload.map : {};
  const rows = buildRowsFromMapObject(mapObj);

  const battleTimeMsRaw = payload?.battleTime;
  const battleTimeMs = Number.isFinite(Number(battleTimeMsRaw)) ? Number(battleTimeMsRaw) : null;

  return {rows, targetName, battleTimeMs};
}

function buildRowsFromMapObject(mapObj) {
  const rows = [];

  for (const [id, value] of Object.entries(mapObj || {})) {
    const isObj = value && typeof value === "object";

    const job = isObj ? (value.job || "") : "";
    const dpsRaw = isObj ? value.dps : value;
    const dps = Math.trunc(Number(dpsRaw));

    // dps계산시점에서 dps가 올바르지 않으면 return
    if (!Number.isFinite(dps)) {
      continue;
    }

    const nickname = isObj ? (value.nickname || "") : "";
    const name = nickname || String(id);
    const damageContribution = isObj ? Number(value.damageContribution).toFixed(1) : "";

    rows.push({
      id: id,
      name: name,
      job,
      dps,
      damageContribution,
      isUser: name === USER_NAME,
    });
  }

  return rows.sort((a, b) => Number(b.damageContribution || 0) - Number(a.damageContribution || 0));
}
