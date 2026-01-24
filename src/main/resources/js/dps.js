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
    return false;
  }

  nextDpsById.clear();

  let changed = false;

  for (const row of serverRows) {
    const id = row?.id ?? row?.name;
    if (!id) continue;

    const dps = Math.trunc(Number(row?.dps) || 0);
    nextDpsById.set(id, dps);

    const prev = prevDpsById.get(id);
    if (prev === undefined || prev !== dps) {
      changed = true;
    }
  }

  if (!changed) {
    if (prevDpsById.size !== nextDpsById.size) {
      changed = true;
    } else {
      for (const id of prevDpsById.keys()) {
        if (!nextDpsById.has(id)) {
          changed = true;
          break;
        }
      }
    }
  }

  const tmp = prevDpsById;
  prevDpsById = nextDpsById;
  nextDpsById = tmp;

  return changed;
}

