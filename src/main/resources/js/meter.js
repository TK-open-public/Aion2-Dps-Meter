const createMeterUI = ({ elList, dpsFormatter, getUserName, onClickUserRow }) => {
  const MAX_CACHE = 32;

  const rowViewById = new Map();
  let lastVisibleIds = new Set();

  const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  const createRowView = (id) => {
    const rowEl = document.createElement("div");
    rowEl.className = "item";
    rowEl.style.display = "none";
    rowEl.dataset.rowId = String(id);

    const fillEl = document.createElement("div");
    fillEl.className = "fill";

    const contentEl = document.createElement("div");
    contentEl.className = "content";

    const classIconEl = document.createElement("div");
    classIconEl.className = "classIcon";

    const nameEl = document.createElement("div");
    nameEl.className = "name";

    const dpsEl = document.createElement("div");
    dpsEl.className = "dps";

    contentEl.appendChild(classIconEl);
    contentEl.appendChild(nameEl);
    contentEl.appendChild(dpsEl);

    rowEl.appendChild(fillEl);
    rowEl.appendChild(contentEl);

    const view = {
      id,
      rowEl,
      nameEl,
      dpsEl,
      fillEl,
      currentRow: null,
      lastSeenAt: 0,
    };

    rowEl.addEventListener("click", () => {
      if (view.currentRow?.isUser) onClickUserRow?.(view.currentRow);
    });

    return view;
  };

  const getRowView = (id) => {
    let view = rowViewById.get(id);
    if (!view) {
      view = createRowView(id);
      rowViewById.set(id, view);
      elList.appendChild(view.rowEl);
    }
    return view;
  };

  // 상위 6개 + 유저(유저가 top6 밖이면 7개)
  const getDisplayRows = (sortedAll) => {
    const top6 = sortedAll.slice(0, 6);
    const user = sortedAll.find((x) => x.isUser);

    if (!user) return top6;
    if (top6.some((x) => x.isUser)) return top6;
    return [...top6, user];
  };

  const buildRowsFromJson = (jsonStr) => {
    const userName = getUserName();
    let obj;

    try {
      obj = JSON.parse(jsonStr);
    } catch {
      return [];
    }

    const rows = [];
    for (const [name, value] of Object.entries(obj || {})) {
      const dps = Math.trunc(Number(value));
      if (!Number.isFinite(dps)) continue;

      rows.push({
        id: name,
        name,
        dps,
        isUser: name === userName,
      });
    }
    return rows;
  };

  const pruneCache = (keepIds) => {
    if (rowViewById.size <= MAX_CACHE) return;

    const candidates = [];
    for (const [id, view] of rowViewById) {
      if (keepIds.has(id)) {
        continue;
      }
      candidates.push({ id, t: view.lastSeenAt || 0 });
    }

    candidates.sort((a, b) => a.t - b.t); // 오래된거 제거

    for (let i = 0; rowViewById.size > MAX_CACHE && i < candidates.length; i++) {
      const id = candidates[i].id;
      const view = rowViewById.get(id);
      if (!view) continue;
      view.rowEl.remove();
      rowViewById.delete(id);
    }
  };

  const renderRows = (rows) => {
    const now = nowMs();
    const nextVisibleIds = new Set();

    elList.classList.toggle("hasRows", rows.length > 0);

    let topDps = 1;
    for (const row of rows) topDps = Math.max(topDps, Number(row?.dps) || 0);

    for (const row of rows) {
      if (!row) continue;

      const id = row.id ?? row.name;
      if (!id) continue;

      nextVisibleIds.add(id);

      const view = getRowView(id);
      view.currentRow = row;
      view.lastSeenAt = now;

      view.rowEl.style.display = "";
      view.rowEl.classList.toggle("isUser", !!row.isUser);

      view.nameEl.textContent = row.name ?? "";

      const dps = Number(row.dps) || 0;
      view.dpsEl.textContent = `${dpsFormatter.format(dps)}/초`;

      const ratio = Math.max(0, Math.min(1, dps / topDps));
      view.fillEl.style.transform = `scaleX(${ratio})`;

      elList.appendChild(view.rowEl);
    }

    for (const id of lastVisibleIds) {
      if (nextVisibleIds.has(id)) continue;
      const view = rowViewById.get(id);
      if (view) view.rowEl.style.display = "none";
    }

    lastVisibleIds = nextVisibleIds;

    pruneCache(nextVisibleIds);
  };

  const updateFromJson = (jsonStr) => {
    const rows = buildRowsFromJson(jsonStr);
    rows.sort((a, b) => (Number(b?.dps) || 0) - (Number(a?.dps) || 0));
    renderRows(getDisplayRows(rows));
  };

  const updateFromRows = (rows) => {
    const arr = Array.isArray(rows) ? rows.slice() : [];
    arr.sort((a, b) => (Number(b?.dps) || 0) - (Number(a?.dps) || 0));
    renderRows(getDisplayRows(arr));
  };
  const onResetMeterUi = () => {
    elList.classList.remove("hasRows");
    lastVisibleIds = new Set();
    elList.replaceChildren();
    rowViewById.clear();
  };
  return { updateFromJson, updateFromRows, onResetMeterUi };
};
