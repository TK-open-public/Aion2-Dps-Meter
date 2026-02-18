(function () {
  const storageKey = "aion2.hotkey.reset";
  const defaultHotkey = { mods: 0x0002, vk: 0x52, label: "CTRL + R" };
  const BRIDGE_RETRY_MS = 200;
  const BRIDGE_RETRY_LIMIT = 50;
  const modifierLabels = [
    { bit: 0x0002, label: "CTRL" },
    { bit: 0x0001, label: "ALT" },
    { bit: 0x0004, label: "SHIFT" },
    { bit: 0x0008, label: "WIN" },
  ];

  const normalizeKeyName = (raw) => {
    if (!raw) return "";
    const name = String(raw).toUpperCase();
    if (name.startsWith("DIGIT")) return name.replace("DIGIT", "");
    if (name.startsWith("NUMPAD")) return name.replace("NUMPAD", "NUMPAD ");
    if (name.startsWith("KEY")) return name.replace("KEY", "");
    return name;
  };

  const modsFromDetail = (detail) => {
    let mods = 0;
    if (detail?.ctrl) mods |= 0x0002;
    if (detail?.alt) mods |= 0x0001;
    if (detail?.shift) mods |= 0x0004;
    if (detail?.meta) mods |= 0x0008;
    return mods;
  };

  const labelFromDetail = (detail) => {
    const parts = [];
    const mods = modsFromDetail(detail);
    modifierLabels.forEach((mod) => {
      if (mods & mod.bit) parts.push(mod.label);
    });
    const keyName = normalizeKeyName(detail?.keyName || detail?.text || "");
    if (keyName) parts.push(keyName);
    return parts.join(" + ");
  };

  const loadHotkey = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const mods = Number(parsed.mods);
      const vk = Number(parsed.vk);
      const label = String(parsed.label ?? "").trim();
      if (!Number.isFinite(mods) || !Number.isFinite(vk) || !label) return null;
      return { mods, vk, label };
    } catch {
      return null;
    }
  };

  const saveHotkey = (data) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const applyHotkey = (data) => {
    if (!data || typeof data !== "object") return;
    if (!window.javaBridge?.setHotkey) return;
    window.javaBridge.setHotkey(data.mods, data.vk);
  };

  const createSettingsUI = ({ panel, closeBtn, saveBtn, input }) => {
    if (!panel || !closeBtn || !saveBtn || !input) {
      return null;
    }

    const stored = loadHotkey();
    let current = stored ?? { ...defaultHotkey };
    if (!stored) saveHotkey(current);
    input.value = current.label || "";

    const ensureBridge = (attempt = 0) => {
      if (window.javaBridge?.setHotkey) {
        applyHotkey(current);
        return;
      }
      if (attempt >= BRIDGE_RETRY_LIMIT) return;
      setTimeout(() => ensureBridge(attempt + 1), BRIDGE_RETRY_MS);
    };
    ensureBridge();

    let isCapturing = false;

    const handleCaptureEvent = (event) => {
      if (!isCapturing) return;
      const detail = event?.detail || {};
      const label = labelFromDetail(detail);
      const mods = modsFromDetail(detail);
      if (!(mods & 0x0002 || mods & 0x0001)) {
        return;
      }
      const vk = Number(detail?.keyCode);
      if (!Number.isFinite(vk) || !label) return;
      current = { mods, vk, label };
      input.value = label;
    };

    const startCapture = () => {
      if (isCapturing) return;
      isCapturing = true;
      input.classList.add("isCapturing");
      window.addEventListener("settings:captureKey", handleCaptureEvent);
      window.javaBridge?.startKeyCapture?.();
    };

    const stopCapture = () => {
      if (!isCapturing) return;
      isCapturing = false;
      input.classList.remove("isCapturing");
      window.removeEventListener("settings:captureKey", handleCaptureEvent);
      window.javaBridge?.stopKeyCapture?.();
    };

    const open = () => {
      panel.classList.add("open");
      input.blur();
    };

    const close = () => {
      panel.classList.remove("open");
      stopCapture();
    };

    closeBtn.addEventListener("click", close);

    saveBtn.addEventListener("click", () => {
      saveHotkey(current);
      applyHotkey(current);
      close();
    });

    input.addEventListener("focus", startCapture);
    input.addEventListener("blur", stopCapture);

    return { open, close };
  };

  window.createSettingsUI = createSettingsUI;
})();
