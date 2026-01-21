let USER_NAME = "-------";
let nextDpsById = new Map();
let prevDpsById = new Map();

function buildRowsFromPayload(raw) {
  const payload = JSON.parse(raw);
  const targetName = typeof payload?.targetName === "string" ? payload.targetName : "";

  const mapObj = payload?.map && typeof payload.map === "object" ? payload.map : {};
  const rows = buildRowsFromMapObject(mapObj);

  return {rows, targetName};
}

function buildRowsFromMapObject(mapObj) {
  const rows = [];

  for (const [id, value] of Object.entries(mapObj || {})) {
    const isObj = value && typeof value === "object";

    const job = isObj ? (value.job || "") : "";
    const dpsRaw = isObj ? value.dps : value;
    const dps = Math.trunc(Number(dpsRaw));
    const nickname = isObj ? (value.nickname || "") : "";
    const name = nickname || String(id);
    const damageContribution = isObj ? Number(value.damageContribution).toFixed(1) : "";

    if (!Number.isFinite(dps)) {
      continue;
    }

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

function computedDps(serverRows) {
  if (!Array.isArray(serverRows) || serverRows.length === 0) {
    const changed = prevDpsById.size > 0;
    if (changed) {
      nextDpsById.clear();
      [prevDpsById, nextDpsById] = [nextDpsById, prevDpsById];
    }
    return changed;
  }

  nextDpsById.clear();

  // 새 데이터 맵 생성
  for (const row of serverRows) {
    const id = row?.id || row?.name;
    if (id) {
      nextDpsById.set(id, Math.trunc(Number(row?.dps) || 0));
    }
  }

  // 크기 비교
  if (prevDpsById.size !== nextDpsById.size) {
    [prevDpsById, nextDpsById] = [nextDpsById, prevDpsById];
    return true;
  }

  // 값 비교
  for (const [id, dps] of nextDpsById) {
    if (prevDpsById.get(id) !== dps) {
      [prevDpsById, nextDpsById] = [nextDpsById, prevDpsById];
      return true;
    }
  }

  [prevDpsById, nextDpsById] = [nextDpsById, prevDpsById];
  return false;
}

