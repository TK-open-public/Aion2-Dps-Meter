(() => {
  const API = "https://api.github.com/repos/TK-open-public/Aion2-Dps-Meter/releases?per_page=10";
  const URL = "https://github.com/TK-open-public/Aion2-Dps-Meter/releases";
  const START_DELAY = 800,
    RETRY = 500,
    LIMIT = 5;

  const parseVersion = (value) => {
    const raw = String(value || "")
      .trim()
      .replace(/^v/i, "");
    const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) return null;
    return {
      major: Number(match[1]),
      minor: Number(match[2]),
      patch: Number(match[3]),
      pre: match[4] || null,
      raw,
    };
  };

  const comparePre = (a, b) => {
    const aParts = String(a).split(".");
    const bParts = String(b).split(".");
    const toId = (v) => (/^\d+$/.test(v) ? Number(v) : v);
    const max = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < max; i++) {
      if (i >= aParts.length) return -1;
      if (i >= bParts.length) return 1;
      const left = toId(aParts[i]);
      const right = toId(bParts[i]);
      const leftNum = typeof left === "number";
      const rightNum = typeof right === "number";
      if (leftNum && rightNum) {
        if (left !== right) return left > right ? 1 : -1;
      } else if (leftNum !== rightNum) {
        return leftNum ? -1 : 1;
      } else {
        const cmp = String(left).localeCompare(String(right));
        if (cmp !== 0) return cmp;
      }
    }
    return 0;
  };

  const compareVersion = (a, b) => {
    if (!a || !b) return 0;
    if (a.major !== b.major) return a.major > b.major ? 1 : -1;
    if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
    if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
    if (!a.pre && !b.pre) return 0;
    if (!a.pre && b.pre) return 1;
    if (a.pre && !b.pre) return -1;
    return comparePre(a.pre, b.pre);
  };

  const pickLatest = (releases, wantPrerelease) => {
    let best = null;
    releases.forEach((release) => {
      if (release.draft) return;
      if (!!release.prerelease !== wantPrerelease) return;
      const version = parseVersion(release.tag_name);
      if (!version) return;
      if (!best || compareVersion(version, best.version) > 0) {
        best = { version, prerelease: !!release.prerelease };
      }
    });
    return best;
  };

  let modal;
  let text;
  let once = false;

  const start = () =>
    setTimeout(async () => {
      if (once) return;
      once = true;

      modal = document.querySelector("#updateModal");
      text = document.querySelector("#updateModalText");

      const confirmBtn = document.querySelector(".updateModalBtn.primary");
      const cancelBtn = document.querySelector(".updateModalBtn.secondary");
      if (confirmBtn) {
        confirmBtn.onclick = () => {
          modal.classList.remove("isOpen");
          window.javaBridge.openBrowser(URL);
          window.javaBridge.exitApp();
        };
      }
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          modal.classList.remove("isOpen");
        };
      }

      for (
        let i = 0;
        i < LIMIT && !(window.dpsData?.getVersion && window.javaBridge?.openBrowser);
        i++
      ) {
        await new Promise((r) => setTimeout(r, RETRY));
      }
      if (!(window.dpsData?.getVersion && window.javaBridge?.openBrowser)) {
        return;
      }

      const current = parseVersion(window.dpsData.getVersion());
      if (!current) return;

      const res = await fetch(API, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!res.ok) return;

      const list = await res.json();
      const latestStable = pickLatest(list, false);
      const latestBeta = pickLatest(list, true);

      let target = null;
      if (latestStable && compareVersion(latestStable.version, current) > 0) {
        target = latestStable;
      } else if (latestBeta && compareVersion(latestBeta.version, current) > 0) {
        target = latestBeta;
      }

      if (target) {
        const label = target.prerelease ? "베타" : "정식";
        text.textContent = `신규 ${label} 업데이트가 있습니다!\n\n현재 버전 : v.${current.raw}\n최신 버전 : v.${target.version.raw}\n\n업데이트를 먼저 진행해주세요.`;
        modal.classList.add("isOpen");
      }
    }, START_DELAY);

  window.ReleaseChecker = { start };
})();
