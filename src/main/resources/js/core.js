class DpsApp {
  static instance;

  constructor() {
    if (DpsApp.instance) return DpsApp.instance;

    this.POLL_MS = 200;
    this.USER_NAME = "-------";

    this.dpsFormatter = new Intl.NumberFormat("ko-KR");
    this.lastJson = null;
    this.isCollapse = false;

    // 빈데이터 덮어쓰기 방지 스냅샷
    this.lastSnapshot = null;
    // reset 직후 서버가 구 데이터 계속 주는 현상 방지
    this.resetPending = false;

    this.BATTLE_TIME_BASIS = "render";
    this.GRACE_MS = 30000;
    this.GRACE_ARM_MS = 1000;


    // battleTime 캐시
    this._battleTimeVisible = false;
    this._lastBattleTimeMs = null;
    this._lastEncounterToken = null;

    this._pollTimer = null;
    this.historyEntries = [];
    this.historyPanelOpen = false;
    this._floatingPanelZ = 1600;
    this._panelPositionStoragePrefix = "aion2.panel.position.";

    DpsApp.instance = this;
  }

  static createInstance() {
    if (!DpsApp.instance) DpsApp.instance = new DpsApp();
    return DpsApp.instance;
  }

  start() {
    this.elList = document.querySelector(".list");
    this.elBossName = document.querySelector(".bossName");
    this.elBossName.textContent = "DPS METER";

    this.resetBtn = document.querySelector(".resetBtn");
    this.collapseBtn = document.querySelector(".collapseBtn");
    this.historyBtn = document.querySelector(".historyBtn");
    this.settingsBtn = document.querySelector(".settingsBtn");
    this.settingsPanel = document.querySelector(".settingsPanel");
    this.settingsClose = document.querySelector(".settingsClose");
    this.settingsSave = document.querySelector(".settingsSave");
    this.settingsInput = document.querySelector(".settingsInput");
    this.historyPanel = document.querySelector(".historyPanel");
    this.historyClose = document.querySelector(".historyClose");
    this.historyList = document.querySelector(".historyList");
    this.historyRefresh = document.querySelector(".historyRefresh");
    this.detailsPanel = document.querySelector(".detailsPanel");
    this.detailsClose = document.querySelector(".detailsClose");
    this.detailsTitle = document.querySelector(".detailsTitle");
    this.detailsStatsEl = document.querySelector(".detailsStats");
    this.skillsListEl = document.querySelector(".skills");
    this.consolePanel = document.querySelector(".console");

    this.bindHeaderButtons();
    this.bindHistoryUI();
    this.bindFloatingPanels();
    this.bindDragToMoveWindow();
    this.bindSettingsUI();
    this.bindNativeKeyEvents();

    this.meterUI = createMeterUI({
      elList: this.elList,
      dpsFormatter: this.dpsFormatter,
      getUserName: () => this.USER_NAME,
      onClickUserRow: (row) => {
        this.raiseFloatingPanel(this.detailsPanel);
        this.detailsUI.open(row);
      },
    });

    this.battleTime = createBattleTimeUI({
      rootEl: document.querySelector(".battleTime"),
      tickSelector: ".tick",
      statusSelector: ".status",
      graceMs: this.GRACE_MS,
      graceArmMs: this.GRACE_ARM_MS,
      visibleClass: "isVisible",
    });
    this.battleTime.setVisible(false);

    this.detailsUI = createDetailsUI({
      detailsPanel: this.detailsPanel,
      detailsClose: this.detailsClose,
      detailsTitle: this.detailsTitle,
      detailsStatsEl: this.detailsStatsEl,
      skillsListEl: this.skillsListEl,
      dpsFormatter: this.dpsFormatter,
      getDetails: (row) => this.getDetails(row),
    });
    this.refreshEncounterHistory();
    window.ReleaseChecker?.start?.();

    this.startPolling();
    this.fetchDps();
  }

  nowMs() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  safeParseJSON(raw, fallback = {}) {
    if (typeof raw !== "string") {
      return fallback;
    }
    try {
      const value = JSON.parse(raw);
      return value && typeof value === "object" ? value : fallback;
    } catch {
      return fallback;
    }
  }

  startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(() => this.fetchDps(), this.POLL_MS);
  }

  stopPolling() {
    if (!this._pollTimer) return;
    clearInterval(this._pollTimer);
    this._pollTimer = null;
  }

  resetAll({ callBackend = true } = {}) {
    this.resetPending = !!callBackend;


    this.lastSnapshot = null;
    this.lastJson = null;
    this._lastEncounterToken = null;

    this._battleTimeVisible = false;
    this._lastBattleTimeMs = null;
    this.battleTime?.reset?.();
    this.battleTime?.setVisible?.(false);

    this.detailsUI?.close?.();
    this.meterUI?.onResetMeterUi?.();

    if (this.elBossName) {
      this.elBossName.textContent = "DPS METER";
    }
    if (callBackend) {
      window.javaBridge?.resetDps?.();
    }
  }




  fetchDps() {
    if (this.isCollapse) return;
    const now = this.nowMs();
    const raw = window.dpsData?.getDpsData?.();
    // globalThis.uiDebug?.log?.("getBattleDetail", raw);

    // 값이 없으면 타이머 숨김
    if (typeof raw !== "string") {
      this._rawLastChangedAt = now;

      this._lastBattleTimeMs = null;
      this._battleTimeVisible = false;
      this.battleTime.setVisible(false);
      return;
    }

    if (raw === this.lastJson) {
      const shouldBeVisible = this._battleTimeVisible && !this.isCollapse;

      this.battleTime.setVisible(shouldBeVisible);
      if (shouldBeVisible) {
        this.battleTime.update(now, this._lastBattleTimeMs);
      }
  
      return;
    }

    this.lastJson = raw;

    const { rows, targetName, battleTimeMs, encounterToken } = this.buildRowsFromPayload(raw);
    this._lastBattleTimeMs = battleTimeMs;

    if (encounterToken !== null && encounterToken !== this._lastEncounterToken) {
      this._lastEncounterToken = encounterToken;
      this.lastSnapshot = null;
      this.detailsUI?.close?.();
      this.meterUI?.onResetMeterUi?.();
      this.refreshEncounterHistory();
    }


    const showByServer = rows.length > 0;
    if (this.resetPending) {
      const resetAck = rows.length === 0;

      this._battleTimeVisible = false;
      this.battleTime.setVisible(false);

      if (!resetAck) {
        return;
      }

      this.resetPending = false;
    }
    // 빈값은 ui 안덮어씀
    let rowsToRender = rows;
    if (rows.length === 0) {
      if (this.lastSnapshot) rowsToRender = this.lastSnapshot;
      else {
        this._battleTimeVisible = false;
        this.battleTime.setVisible(false);
        return;
      }
    } else {
      this.lastSnapshot = rows;
    }

    // 타이머 표시 여부
    const showByRender = rowsToRender.length > 0;
    const showBattleTime = this.BATTLE_TIME_BASIS === "server" ? showByServer : showByRender;

    const eligible = showBattleTime && Number.isFinite(Number(battleTimeMs));

    this._battleTimeVisible = eligible;
    const shouldBeVisible = eligible && !this.isCollapse;

    this.battleTime.setVisible(shouldBeVisible);

    if (shouldBeVisible) {
      this.battleTime.update(now, battleTimeMs);
    }

    // 렌더
    this.elBossName.textContent = targetName ? targetName : "";
    this.meterUI.updateFromRows(rowsToRender);
  }

  buildRowsFromPayload(raw) {
    const payload = this.safeParseJSON(raw, {});
    const targetName = typeof payload?.targetName === "string" ? payload.targetName : "";

    const mapObj = payload?.map && typeof payload.map === "object" ? payload.map : {};
    const rows = this.buildRowsFromMapObject(mapObj);

    const battleTimeMsRaw = payload?.battleTime;
    const battleTimeMs = Number.isFinite(Number(battleTimeMsRaw)) ? Number(battleTimeMsRaw) : null;
    const encounterTokenRaw = payload?.encounterToken;
    const encounterToken = Number.isFinite(Number(encounterTokenRaw))
      ? Number(encounterTokenRaw)
      : null;

    return { rows, targetName, battleTimeMs, encounterToken };
  }

  buildRowsFromMapObject(mapObj) {
    const rows = [];

    for (const [id, value] of Object.entries(mapObj || {})) {
      const isObj = value && typeof value === "object";

      const job = isObj ? (value.job ?? "") : "";
      const nickname = isObj ? (value.nickname ?? "") : "";
      const name = nickname || String(id);

      const dpsRaw = isObj ? value.dps : value;
      const dps = Math.trunc(Number(dpsRaw));

      // 소수점 한자리
      const contribRaw = isObj ? Number(value.damageContribution) : NaN;
      const damageContribution = Number.isFinite(contribRaw)
        ? Math.round(contribRaw * 10) / 10
        : NaN;

      if (!Number.isFinite(dps)) {
        continue;
      }

      rows.push({
        id: String(id),
        name,
        job,
        dps,
        damageContribution,
        isUser: name === this.USER_NAME,
      });
    }

    return rows;
  }

  refreshEncounterHistory() {
    const raw = window.dpsData?.getEncounterHistory?.();
    if (typeof raw !== "string") {
      this.historyEntries = [];
      this.renderEncounterHistory();
      return;
    }
    const parsed = this.safeParseJSON(raw, []);
    this.historyEntries = Array.isArray(parsed) ? parsed : [];
    this.renderEncounterHistory();
  }

  renderEncounterHistory() {
    if (!this.historyList) return;
    this.historyList.replaceChildren();

    if (!Array.isArray(this.historyEntries) || this.historyEntries.length === 0) {
      const emptyEl = document.createElement("div");
      emptyEl.className = "historyEmpty";
      emptyEl.textContent = "아직 저장된 전투 기록이 없습니다.";
      this.historyList.appendChild(emptyEl);
      return;
    }

    this.historyEntries.forEach((entry) => {
      const item = entry && typeof entry === "object" ? entry : {};
      const targetName = String(item.targetName ?? "").trim() || "알 수 없음";
      const encounterToken = Number(item.token);
      const endedAt = Number(item.endedAt);
      const battleTimeMs = Math.max(0, Math.trunc(Number(item.battleTime) || 0));
      const totalDamage = Math.max(0, Math.trunc(Number(item.totalDamage) || 0));
      const participantCount = Math.max(0, Math.trunc(Number(item.participantCount) || 0));
      const participants = Array.isArray(item.participants) ? item.participants : [];

      const rowEl = document.createElement("div");
      rowEl.className = "historyItem";

      const topEl = document.createElement("div");
      topEl.className = "historyTop";
      const targetEl = document.createElement("div");
      targetEl.className = "historyTarget";
      targetEl.textContent = targetName;
      const clockEl = document.createElement("div");
      clockEl.className = "historyTime";
      clockEl.textContent = this.formatHistoryClock(endedAt);
      topEl.append(targetEl, clockEl);

      const bottomEl = document.createElement("div");
      bottomEl.className = "historyBottom";
      const battleEl = document.createElement("div");
      battleEl.textContent = `전투 ${this.formatHistoryDuration(battleTimeMs)}`;
      const damageEl = document.createElement("div");
      damageEl.textContent = `총딜 ${this.dpsFormatter.format(totalDamage)}`;
      const partyEl = document.createElement("div");
      partyEl.textContent = `참여 ${participantCount}명`;
      bottomEl.append(battleEl, damageEl, partyEl);

      const membersEl = document.createElement("div");
      membersEl.className = "historyMembers";
      if (Number.isFinite(encounterToken)) {
        participants.forEach((memberRaw) => {
        const member = memberRaw && typeof memberRaw === "object" ? memberRaw : {};
        const uid = Number(member.uid);
        if (!Number.isFinite(uid)) return;
        const nickname = String(member.nickname ?? "").trim() || String(uid);
        const contrib = Number(member.damageContribution);
        const contribText = Number.isFinite(contrib) ? `${contrib.toFixed(1)}%` : "-";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "historyMember";
        btn.textContent = `${nickname} (${contribText})`;
        btn.addEventListener("click", () => {
          this.raiseFloatingPanel(this.detailsPanel);
          this.detailsUI?.open?.({
            id: `h-${encounterToken}-${uid}`,
            uid,
            name: nickname,
            damageContribution: contrib,
            historyToken: encounterToken,
            historyBattleTime: battleTimeMs,
          }, { force: true });
        });
        membersEl.appendChild(btn);
        });
      }

      rowEl.append(topEl, bottomEl, membersEl);
      this.historyList.appendChild(rowEl);
    });
  }

  formatHistoryDuration(ms) {
    const totalSec = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  formatHistoryClock(ts) {
    if (!Number.isFinite(ts) || ts <= 0) return "--:--:--";
    const date = new Date(ts);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  openHistoryPanel() {
    if (!this.historyPanel) return;
    this.settingsUI?.close?.();
    this.detailsUI?.close?.();
    this.refreshEncounterHistory();
    this.historyPanel.classList.add("open");
    this.raiseFloatingPanel(this.historyPanel);
    this.historyPanelOpen = true;
  }

  closeHistoryPanel() {
    if (!this.historyPanel) return;
    this.historyPanel.classList.remove("open");
    this.historyPanelOpen = false;
  }

  bindHistoryUI() {
    this.historyBtn?.addEventListener("click", () => {
      if (this.historyPanelOpen) {
        this.closeHistoryPanel();
      } else {
        this.openHistoryPanel();
      }
    });
    this.historyClose?.addEventListener("click", () => this.closeHistoryPanel());
    this.historyRefresh?.addEventListener("click", () => this.refreshEncounterHistory());
  }

  async getDetails(row) {
    const historyToken = Number(row?.historyToken);
    const participantUid = Number(row?.uid);
    const isHistoryRow = Number.isFinite(historyToken);
    const raw = isHistoryRow
      ? await window.dpsData?.getEncounterBattleDetail?.(historyToken, Number.isFinite(participantUid) ? participantUid : -1)
      : await window.dpsData?.getBattleDetail?.(row.id);
    let detailObj = raw;
    // globalThis.uiDebug?.log?.("getBattleDetail", detailObj);

    if (typeof raw === "string") detailObj = this.safeParseJSON(raw, {});
    if (!detailObj || typeof detailObj !== "object") detailObj = {};

    const skills = [];
    let totalDmg = 0;

    let totalTimes = 0;
    let totalCrit = 0;
    let totalParry = 0;
    let totalBack = 0;
    let totalPerfect = 0;
    let totalDouble = 0;

    for (const [code, value] of Object.entries(detailObj)) {
      if (!value || typeof value !== "object") continue;

      const nameRaw = typeof value.skillName === "string" ? value.skillName.trim() : "";
      const baseName = nameRaw ? nameRaw : `스킬 ${code}`;

      // 공통 
      const pushSkill = ({
        codeKey,
        name,
        time,
        dmg,
        crit = 0,
        parry = 0,
        back = 0,
        perfect = 0,
        double = 0,
        countForTotals = true,
      }) => {
        const dmgInt = Math.trunc(Number(String(dmg ?? "").replace(/,/g, ""))) || 0;
        if (dmgInt <= 0) {
          return;
        }

        const t = Number(time) || 0;

        totalDmg += dmgInt;
        if (countForTotals) {
          totalTimes += t;
          totalCrit += Number(crit) || 0;
          totalParry += Number(parry) || 0;
          totalBack += Number(back) || 0;
          totalPerfect += Number(perfect) || 0;
          totalDouble += Number(double) || 0;
        }
        skills.push({
          code: String(codeKey),
          name,
          time: t,
          crit: Number(crit) || 0,
          parry: Number(parry) || 0,
          back: Number(back) || 0,
          perfect: Number(perfect) || 0,
          double: Number(double) || 0,
          dmg: dmgInt,
        });
      };

      // 일반 피해
      pushSkill({
        codeKey: code,
        name: baseName,
        time: value.times,
        dmg: value.damageAmount,
        crit: value.critTimes,
        parry: value.parryTimes,
        back: value.backTimes,
        perfect: value.perfectTimes,
        double: value.doubleTimes,
      });

      // 도트피해
      if (Number(String(value.dotDamageAmount ?? "").replace(/,/g, "")) > 0) {
        pushSkill({
          codeKey: `${code}-dot`, // 유니크키
          name: `${baseName} - 지속피해`,
          time: value.dotTimes,
          dmg: value.dotDamageAmount,
          countForTotals: false,
        });
      }
    }

    const pct = (num, den) => {
      if (den <= 0) return 0;
      return Math.round((num / den) * 1000) / 10;
    };
    const contributionPct = Number(row?.damageContribution);
    const historyBattleTime = Number(row?.historyBattleTime);
    const combatTime = Number.isFinite(historyBattleTime)
      ? this.formatHistoryDuration(historyBattleTime)
      : (this.battleTime?.getCombatTimeText?.() ?? "00:00");

    return {
      totalDmg,
      contributionPct,
      totalCritPct: pct(totalCrit, totalTimes),
      totalParryPct: pct(totalParry, totalTimes),
      totalBackPct: pct(totalBack, totalTimes),
      totalPerfectPct: pct(totalPerfect, totalTimes),
      totalDoublePct: pct(totalDouble, totalTimes),
      combatTime,

      skills,
    };
  }

  bindHeaderButtons() {
    this.settingsBtn?.addEventListener("click", () => {
      if (!this.settingsUI) this.bindSettingsUI();
      this.raiseFloatingPanel(this.settingsPanel);
      this.settingsUI?.open?.();
    });
    this.collapseBtn?.addEventListener("click", () => {
      this.isCollapse = !this.isCollapse;

      // 접히면 polling 멈추고 완전 초기화
      if (this.isCollapse) {
        this.stopPolling();
        this.elList.style.display = "none";
        this.closeHistoryPanel();
        this.resetAll({ callBackend: true });
      } else {
        // 펼치면 polling 재개하고 즉시 1회 fetch
        this.elList.style.display = "grid";
        this.startPolling();
        this.fetchDps();
      }

      const iconEl = this.collapseBtn.querySelector(".collapseIcon");
      if (!iconEl) {
        return;
      }

      iconEl.textContent = this.isCollapse ? "▾" : "▴";
    });
    this.resetBtn?.addEventListener("click", () => {
      this.resetAll({ callBackend: true });
    });
  }

  bindSettingsUI() {
    if (this.settingsUI || typeof window.createSettingsUI !== "function") return;
    this.settingsUI = window.createSettingsUI({
      panel: this.settingsPanel,
      closeBtn: this.settingsClose,
      saveBtn: this.settingsSave,
      input: this.settingsInput,
    });
  }

  bindNativeKeyEvents() {
    window.addEventListener("nativeResetHotKey", (event) => {
      const detail = event?.detail;
      if (!detail) return;
      this.resetAll({ callBackend: true });
    });
  }

  bindFloatingPanels() {
    this.bindDraggablePanel({
      panel: this.settingsPanel,
      handleSelector: ".settingsHeader",
      storageName: "settings",
    });
    this.bindDraggablePanel({
      panel: this.historyPanel,
      handleSelector: ".historyHeader",
      storageName: "history",
    });
    this.bindDraggablePanel({
      panel: this.detailsPanel,
      handleSelector: ".detailsHeader",
      storageName: "details",
    });
    this.bindDraggablePanel({
      panel: this.consolePanel,
      handleSelector: ".console",
      storageName: "console",
      mode: "fixed",
      dragTopAreaPx: 24,
    });
  }

  panelStorageKey(name) {
    return `${this._panelPositionStoragePrefix}${name}`;
  }

  loadPanelPosition(panel, storageName, mode = "absolute") {
    if (!panel || !storageName) return;
    try {
      const raw = localStorage.getItem(this.panelStorageKey(storageName));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const left = Number(parsed?.left);
      const top = Number(parsed?.top);
      if (!Number.isFinite(left) || !Number.isFinite(top)) return;
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      if (mode === "fixed") {
        panel.style.position = "fixed";
      }
    } catch {
      // noop
    }
  }

  savePanelPosition(panel, storageName) {
    if (!panel || !storageName) return;
    const computed = window.getComputedStyle(panel);
    const left = Number.parseFloat(computed.left);
    const top = Number.parseFloat(computed.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return;
    try {
      localStorage.setItem(
        this.panelStorageKey(storageName),
        JSON.stringify({ left, top }),
      );
    } catch {
      // noop
    }
  }

  raiseFloatingPanel(panel) {
    if (!panel) return;
    this._floatingPanelZ += 1;
    panel.style.zIndex = String(this._floatingPanelZ);
  }

  bindDraggablePanel({ panel, handleSelector, storageName, mode = "absolute", dragTopAreaPx = 0 }) {
    if (!panel || !handleSelector) return;
    this.loadPanelPosition(panel, storageName, mode);
    panel.addEventListener("mousedown", () => this.raiseFloatingPanel(panel));

    let isDragging = false;
    let startClientX = 0;
    let startClientY = 0;
    let startLeft = 0;
    let startTop = 0;

    panel.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      const targetEl = event.target instanceof Element ? event.target : null;
      if (!targetEl) return;
      const handle = targetEl.closest(handleSelector);
      if (!handle || !panel.contains(handle)) return;
      if (targetEl.closest(".closeX, button, input, select, textarea, a")) return;
      if (dragTopAreaPx > 0) {
        const panelRect = panel.getBoundingClientRect();
        if (event.clientY > panelRect.top + dragTopAreaPx) return;
      }

      this.raiseFloatingPanel(panel);
      const computed = window.getComputedStyle(panel);
      const rect = panel.getBoundingClientRect();
      const parsedLeft = Number.parseFloat(computed.left);
      const parsedTop = Number.parseFloat(computed.top);
      if (mode === "fixed") {
        startLeft = Number.isFinite(parsedLeft) ? parsedLeft : rect.left;
        startTop = Number.isFinite(parsedTop) ? parsedTop : rect.top;
      } else {
        const offsetParentRect = panel.offsetParent?.getBoundingClientRect?.() ?? { left: 0, top: 0 };
        startLeft = Number.isFinite(parsedLeft) ? parsedLeft : rect.left - offsetParentRect.left;
        startTop = Number.isFinite(parsedTop) ? parsedTop : rect.top - offsetParentRect.top;
      }
      startClientX = event.clientX;
      startClientY = event.clientY;
      isDragging = true;

      document.body.style.userSelect = "none";
      event.preventDefault();
    });

    document.addEventListener("mousemove", (event) => {
      if (!isDragging) return;
      const deltaX = event.clientX - startClientX;
      const deltaY = event.clientY - startClientY;
      if (mode === "fixed") {
        panel.style.position = "fixed";
      }

      panel.style.left = `${startLeft + deltaX}px`;
      panel.style.top = `${startTop + deltaY}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.userSelect = "";
      this.savePanelPosition(panel, storageName);
    });
  }

  bindDragToMoveWindow() {
    let isDragging = false;
    let startX = 0,
      startY = 0;
    let initialStageX = 0,
      initialStageY = 0;

    document.addEventListener("mousedown", (e) => {
      const targetEl = e.target instanceof Element ? e.target : null;
      if (!targetEl) return;
      const ignoreTarget = targetEl.closest(
        ".headerBtns, .settingsPanel, .historyPanel, .detailsPanel, .console, input, button"
      );
      if (ignoreTarget) return;
      isDragging = true;
      startX = e.screenX;
      startY = e.screenY;
      initialStageX = window.screenX;
      initialStageY = window.screenY;
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      if (!window.javaBridge) return;

      const deltaX = e.screenX - startX;
      const deltaY = e.screenY - startY;
      window.javaBridge.moveWindow(initialStageX + deltaX, initialStageY + deltaY);
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }
}

// 디버그콘솔
const setupDebugConsole = () => {
  const g = globalThis;
  if (globalThis.uiDebug?.log) return globalThis.uiDebug;

  const consoleDiv = document.querySelector(".console");
  if (!consoleDiv) {
    globalThis.uiDebug = { log: () => {}, clear: () => {} };
    return globalThis.uiDebug;
  }

  const safeStringify = (value) => {
    if (typeof value === "string") return value;
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const appendLine = (line) => {
    consoleDiv.style.display = "block";
    consoleDiv.innerHTML += line + "<br>";
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
  };

  globalThis.uiDebug = {
    clear() {
      consoleDiv.innerHTML = "";
    },
    log(...args) {
      const line = args.map(safeStringify).join(" ");
      appendLine(line);
      console.log(...args);
    },
  };

  return globalThis.uiDebug;
};

setupDebugConsole();
const dpsApp = DpsApp.createInstance();
