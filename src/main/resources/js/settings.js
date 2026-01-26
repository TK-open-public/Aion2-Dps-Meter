const createSettingsUI = ({
  storageKey = "aion2_dps_settings_v1",
  items,
  onChange = () => {},
} = {}) => {
  const defaultItems = [
    {
      key: "autoResetEnabled",
      type: "toggle",
      label: "자동 초기화",
      default: true,
      tooltip:
        "전투 종료(회색) 상태 진입 이후, raw 데이터가 1분간 동일하면 reset을 수행합니다.\n" +
        "상세 패널이 열려 있으면 카운트다운이 일시정지되고, 닫힌 뒤 이어서 진행됩니다.",
    },
  ];

  const list = Array.isArray(items) && items.length ? items : defaultItems;
  const itemByKey = new Map();
  list.forEach((it) => {
    if (!it || typeof it.key !== "string") {
      return;
    }
    itemByKey.set(it.key, it);
  });

  const buildDefaults = () => {
    const d = {};
    list.forEach((it) => {
      if (!it || typeof it.key !== "string") {
        return;
      }
      d[it.key] = it.default;
    });
    return d;
  };

  const state = { ...buildDefaults() };

  const safeParse = (raw) => {
    if (typeof raw !== "string") {
      return null;
    }
    try {
      const v = JSON.parse(raw);
      return v && typeof v === "object" ? v : null;
    } catch {
      return null;
    }
  };

  const canUseLocalStorage = () => {
    try {
      const k = "__aion2_setting";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  };

  const storageOK = canUseLocalStorage();

  const load = () => {
    if (!storageOK) return;
    const obj = safeParse(localStorage.getItem(storageKey));
    if (!obj) return;

    for (const [key, it] of itemByKey.entries()) {
      if (!(key in obj)) continue;

      if (it.type === "toggle" && typeof obj[key] === "boolean") {
        state[key] = obj[key];
      }
      // 추후 확장
    }
  };

  const save = () => {
    if (!storageOK) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  };

  const getState = () => ({ ...state });

  const emitChange = () => {
    onChange(getState());
  };

  const setState = (patch = {}) => {
    let changed = false;

    for (const [key, value] of Object.entries(patch || {})) {
      const it = itemByKey.get(key);
      if (!it) {
        continue;
      }

      if (it.type === "toggle") {
        const next = !!value;
        if (state[key] !== next) {
          state[key] = next;
          changed = true;
        }
      }
    }

    if (!changed) return;

    save();
    syncToUI();
    emitChange();
  };

  const el = {
    btn: null,
    overlay: null,
    modal: null,
    close: null,
    list: null,
  };

  const renderList = () => {
    if (!el.list) return;

    const rowHtml = list
      .map((it) => {
        if (!it || typeof it.key !== "string") return "";

        if (it.type === "toggle") {
          const tip = typeof it.tooltip === "string" && it.tooltip.trim() ? it.tooltip.trim() : "";
          const helpHtml = tip
            ? `
              <div class="settingHelp" tabindex="0" aria-label="${it.label} 기준">
                <i data-lucide="circle-help"></i>
                <div class="settingHelpTip">${tip.replace(/\n/g, "<br>")}</div>
              </div>
            `
            : "";

          return `
            <div class="settingRow" data-key="${it.key}">
              <div class="settingLeft">
                <div class="settingName">${it.label}</div>
                ${helpHtml}
              </div>

              <label class="switch">
                <input
                  type="checkbox"
                  class="settingInput"
                  data-key="${it.key}"
                />
                <span class="switchTrack"></span>
              </label>
            </div>
          `;
        }

        // 추후 확장
        return "";
      })
      .join("");

    el.list.innerHTML = rowHtml;
  };

  const syncToUI = () => {
    if (!el.overlay) return;

    el.overlay.querySelectorAll(".settingInput").forEach((input) => {
      const key = input.getAttribute("data-key");
      const it = itemByKey.get(key);
      if (!it) return;

      if (it.type === "toggle") {
        input.checked = !!state[key];
      }
    });
  };

  const open = () => {
    if (!el.overlay) return;
    el.overlay.classList.add("isOpen");
    el.overlay.setAttribute("aria-hidden", "false");
    syncToUI();
    if (window.lucide?.createIcons) lucide.createIcons({ root: el.overlay });
  };

  const close = () => {
    if (!el.overlay) return;
    el.overlay.classList.remove("isOpen");
    el.overlay.setAttribute("aria-hidden", "true");
  };

  const isOpen = () => !!el.overlay?.classList.contains("isOpen");

  const bind = () => {
    el.btn = document.querySelector(".settingsBtn");
    el.overlay = document.querySelector(".settingsOverlay");
    el.modal = el.overlay?.querySelector(".settingsModal") ?? null;
    el.close = el.overlay?.querySelector(".settingsClose") ?? null;
    el.list = el.overlay?.querySelector(".settingsList") ?? null;

    if (!el.btn || !el.overlay || !el.modal || !el.list) return;

    renderList();
    syncToUI();

    el.btn.addEventListener("click", (e) => {
      e.stopPropagation();
      isOpen() ? close() : open();
    });

    el.close?.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
    });

    el.overlay.addEventListener("mousedown", (e) => {
      if (e.target.closest(".settingsModal")) return;
      close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!isOpen()) return;
      close();
    });

    el.overlay.addEventListener("change", (e) => {
      const input = e.target?.closest?.(".settingInput");
      if (!input) return;

      const key = input.getAttribute("data-key");
      const it = itemByKey.get(key);
      if (!it) return;

      if (it.type === "toggle") {
        setState({ [key]: !!input.checked });
      }
    });

    if (window.lucide?.createIcons) lucide.createIcons({ root: el.overlay });
  };

  load();
  bind();
  emitChange();

  return {
    open,
    close,
    isOpen,
    getState,
    setState,
    storageOK,
  };
};
