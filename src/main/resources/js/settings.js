(function () {
  const MOD_ALT = 0x0001;
  const MOD_CTRL = 0x0002;
  const ALLOWED_MASK = MOD_ALT | MOD_CTRL;

  // 기본값 ctrl r
  const DEFAULT = { modifiers: MOD_CTRL, vkCode: 0x52 };

  // shift 16, ctrl 17 alt18 lwin 91 rwin 92
  const MODIFIER_VKS = new Set([16, 17, 18, 91, 92]);
  const isModifierVk = (vkCode) => MODIFIER_VKS.has(Number(vkCode));

  const NUMPAD_MAP = {
    0x6a: "NUMPAD *",
    0x6b: "NUMPAD +",
    0x6d: "NUMPAD -",
    0x6e: "NUMPAD .",
    0x6f: "NUMPAD /",
  };

  const VK_MAP = {
    0x1b: "ESC",
    0x20: "SPACE",
    0x0d: "ENTER",
    0x09: "TAB",
    0x08: "BACKSPACE",
    0x2e: "DELETE",
    0x2d: "INSERT",
    0x24: "HOME",
    0x23: "END",
    0x21: "PAGE UP",
    0x22: "PAGE DOWN",
    0x25: "LEFT",
    0x26: "UP",
    0x27: "RIGHT",
    0x28: "DOWN",

    0xba: ";",
    0xbb: "=",
    0xbc: ",",
    0xbd: "-",
    0xbe: ".",
    0xbf: "/",
    0xc0: "`",
    0xdb: "[",
    0xdc: "\\",
    0xdd: "]",
    0xde: "'",
  };

  const vkToKeyLabel = (vk) => {
    const n = Number(vk);
    if (!Number.isFinite(n)) {
      return "";
    }

    // 0-9
    if (n >= 0x30 && n <= 0x39) {
      return String.fromCharCode(n);
    }
    // a-z
    if (n >= 0x41 && n <= 0x5a) {
      return String.fromCharCode(n);
    }
    // f1-f24
    if (n >= 0x70 && n <= 0x87) {
      return `F${n - 0x6f}`;
    }
    // numpad 0-9
    if (n >= 0x60 && n <= 0x69) {
      return `NUMPAD ${n - 0x60}`;
    }

    return NUMPAD_MAP[n] || VK_MAP[n] || `VK_${n}`;
  };

  const makeLabel = (modifiers, vkCode) => {
    const parts = [];
    if (modifiers & MOD_CTRL) {
      parts.push("CTRL");
    }
    if (modifiers & MOD_ALT) {
      parts.push("ALT");
    }
    const key = vkToKeyLabel(vkCode);
    if (key) {
      parts.push(key);
    }
    return parts.join(" + ");
  };

  const bridgeGetHotkey = () => {
    const jb = window.javaBridge;
    const fn = jb?.getHotkey || jb?.getHotKey;
    return typeof fn === "function" ? fn.call(jb) : null;
  };

  const bridgeUpdateHotkey = (modifiers, vkCode) => {
    const jb = window.javaBridge;
    const fn = jb?.updateHotkey || jb?.updateHotKey;
    if (typeof fn === "function") {
      fn.call(jb, modifiers, vkCode);
    }
  };

  const parseHotkeyString = (raw) => {
    const s = String(raw || "");
    const m = s.match(/modifiers\s*=\s*(\d+)[\s\S]*?vkCode\s*=\s*(\d+)/i);
    if (!m) {
      return null;
    }

    const modifiers = Number(m[1]) & ALLOWED_MASK;
    const vkCode = Number(m[2]);

    if (!modifiers) {
      return null;
    }
    if (!Number.isFinite(vkCode) || isModifierVk(vkCode)) {
      return null;
    }

    return { modifiers, vkCode };
  };

  const modsFromDetail = (detail) => {
    // 금지
    if (detail?.shift || detail?.meta) {
      return -1;
    }
    return (detail?.ctrl ? MOD_CTRL : 0) | (detail?.alt ? MOD_ALT : 0);
  };

  const waitFor = async (pred, retry = 200, limit = 30) => {
    for (let i = 0; i < limit; i++) {
      if (pred()) {
        return true;
      }
      await new Promise((r) => setTimeout(r, retry));
    }
    return false;
  };

  const createSettingsUI = ({ panel, closeBtn, saveBtn, input }) => {
    if (!panel || !closeBtn || !saveBtn || !input) {
      return null;
    }

    input.readOnly = true;

    let current = { ...DEFAULT };
    let pending = { ...DEFAULT };
    let isCapturing = false;

    const render = () => {
      input.value = makeLabel(pending.modifiers, pending.vkCode);
    };

    const setPending = (mods, vk) => {
      if (!isCapturing) {
        return;
      }
      if (mods < 0) {
        return;
      }

      const modifiers = mods & ALLOWED_MASK;
      const vkCode = Number(vk);

      if (!modifiers) {
        return;
      }
      if (!Number.isFinite(vkCode) || isModifierVk(vkCode)) {
        return;
      }

      pending = { modifiers, vkCode };
      render();
    };

    render();

    (async () => {
      await waitFor(
        () => typeof (window.javaBridge?.getHotkey || window.javaBridge?.getHotKey) === "function",
      );

      const parsed = parseHotkeyString(bridgeGetHotkey());
      current = parsed ? parsed : { ...DEFAULT };
      pending = { ...current };
      render();
    })();

    //  네이티브 캡처 이벤트
    const handleCaptureEvent = (event) => {
      const d = event?.detail || {};
      setPending(modsFromDetail(d), d.keyCode);
    };

    // 키입력
    const handleKeydownFallback = (e) => {
      if (!isCapturing) {
        return;
      }

      // 금지
      if (e.shiftKey || e.metaKey) {
        return;
      }

      const mods = (e.ctrlKey ? MOD_CTRL : 0) | (e.altKey ? MOD_ALT : 0);
      if (!mods) {
        return;
      }

      const vkCode = Number(e.keyCode);
      if (!Number.isFinite(vkCode) || isModifierVk(vkCode)) {
        return;
      }

      e.preventDefault();
      pending = { modifiers: mods, vkCode };
      render();
    };

    const startCapture = () => {
      if (isCapturing) {
        return;
      }
      isCapturing = true;
      input.classList.add("isCapturing");

      window.addEventListener("settings:captureKey", handleCaptureEvent);

      if (typeof window.javaBridge?.startKeyCapture === "function") {
        window.javaBridge.startKeyCapture();
      } else {
        input.addEventListener("keydown", handleKeydownFallback);
      }
    };

    const stopCapture = () => {
      if (!isCapturing) {
        return;
      }
      isCapturing = false;
      input.classList.remove("isCapturing");

      window.removeEventListener("settings:captureKey", handleCaptureEvent);

      if (typeof window.javaBridge?.stopKeyCapture === "function") {
        window.javaBridge.stopKeyCapture();
      } else {
        input.removeEventListener("keydown", handleKeydownFallback);
      }
    };

    const open = () => {
      pending = { ...current };
      render();

      panel.classList.add("open");
      input.blur(); // 자동 캡처 방지
    };

    const close = () => {
      panel.classList.remove("open");
      stopCapture();
    };

    closeBtn.addEventListener("click", close);

    saveBtn.addEventListener("click", () => {
      const mods = pending.modifiers & ALLOWED_MASK;
      if (!mods) {
        return;
      }
      if (isModifierVk(pending.vkCode)) {
        return;
      }

      current = { modifiers: mods, vkCode: pending.vkCode };
      bridgeUpdateHotkey(current.modifiers, current.vkCode);
      close();
    });

    input.addEventListener("focus", startCapture);
    input.addEventListener("blur", stopCapture);

    return { open, close };
  };

  window.createSettingsUI = createSettingsUI;
})();
