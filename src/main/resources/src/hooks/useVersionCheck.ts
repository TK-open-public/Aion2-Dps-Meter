import { useEffect, useRef, useState, useCallback } from "react";
import type { Version, UpdateInfo, DownloadState } from "@/types";

const API = "https://api.github.com/repos/TK-open-public/Aion2-Dps-Meter/releases?per_page=10";
const RELEASE_URL = "https://github.com/TK-open-public/Aion2-Dps-Meter/releases";

const RETRY_INTERVAL = 800;
const RETRY_LIMIT = 5;

const parseVersion = (value: string): Version | null => {
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

const compareVersion = (a: Version, b: Version): number => {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  if (!a.pre && !b.pre) return 0;
  if (!a.pre) return 1;
  if (!b.pre) return -1;
  return a.pre.localeCompare(b.pre);
};

const pickLatest = (
  releases: any[],
  wantPrerelease: boolean,
): { version: Version; msiUrl: string } | null => {
  return releases
    .filter((r) => !r.draft && !!r.prerelease === wantPrerelease)
    .reduce<{ version: Version; msiUrl: string } | null>((best, r) => {
      const v = parseVersion(r.tag_name);
      if (!v) return best;
      const msiAsset = r.assets?.find((a: any) => a.name?.endsWith(".msi"));
      if (!msiAsset) return best;
      if (!best || compareVersion(v, best.version) > 0)
        return { version: v, msiUrl: msiAsset.browser_download_url };
      return best;
    }, null);
};

export const useVersionCheck = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>({ status: "idle" });
  const retryCountRef = useRef(0);
  const currentVersionRef = useRef<Version | null>(null);
  const cancelledRef = useRef(false);

  const checkUpdate = useCallback(async () => {
    cancelledRef.current = true;
    await new Promise((r) => setTimeout(r, 0));
    cancelledRef.current = false;
    retryCountRef.current = 0;

    const check = async () => {
      if (cancelledRef.current) return;

      const version = (window as any).javaBridge?.getVersion?.();
      const current = parseVersion(version ?? "");

      if (!current || !(window as any).javaBridge) {
        if (retryCountRef.current < RETRY_LIMIT) {
          retryCountRef.current++;
          setTimeout(check, RETRY_INTERVAL);
        }
        return;
      }

      currentVersionRef.current = current;

      try {
        const res = await fetch(API, {
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store",
        });

        if (cancelledRef.current) return;
        if (!res.ok) return;

        const releases = await res.json();
        const latestStable = pickLatest(releases, false);
        const latestBeta = pickLatest(releases, true);

        let target: { version: Version; msiUrl: string } | null = null;
        let isPrerelease = false;

        if (latestStable && compareVersion(latestStable.version, current) > 0) {
          target = latestStable;
          isPrerelease = false;
        } else if (current.pre && latestBeta && compareVersion(latestBeta.version, current) > 0) {
          target = latestBeta;
          isPrerelease = true;
        }

        if (target && !cancelledRef.current) {
          setUpdateInfo((prev) => {
            if (prev?.latestVersion === target.version.raw) return prev;
            return {
              currentVersion: current.raw,
              latestVersion: target.version.raw,
              isPrerelease,
              msiUrl: target.msiUrl,
            };
          });
        }
      } catch (e) {}
    };

    check();
  }, []);

  useEffect(() => {
    checkUpdate();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    (window as any).onDownloadProgress = (percent: number) => {
      setDownloadState({ status: "downloading", percent });
    };
    (window as any).onDownloadComplete = () => {
      setDownloadState({ status: "complete" });
    };
    (window as any).onDownloadError = () => {
      setDownloadState({ status: "error" });
    };

    return () => {
      delete (window as any).onDownloadProgress;
      delete (window as any).onDownloadComplete;
      delete (window as any).onDownloadError;
    };
  }, []);

  const startUpdate = () => {
    if (!updateInfo) return;
    setDownloadState({ status: "downloading", percent: 0 });
    (window as any).javaBridge.startUpdate(updateInfo.msiUrl);
  };

  const retryDownload = () => {
    startUpdate();
  };

  const openReleasePage = () => {
    (window as any).javaBridge.openBrowser(RELEASE_URL);
    (window as any).javaBridge.exitApp();
  };

  return {
    updateInfo,
    currentVersion: currentVersionRef.current?.raw ?? null,
    downloadState,
    startUpdate,
    retryDownload,
    openReleasePage,
    checkUpdate,
  };
};
