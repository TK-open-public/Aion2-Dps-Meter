import { useEffect, useRef, useState } from "react";
import type { UpdateInfo, DownloadState } from "@/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  updateInfo: UpdateInfo | null;
  downloadState: DownloadState;
  onClose: () => void;
  onUpdate: () => void;
  onRetryDownload: () => void;
  onReady?: () => void;
  onOpenReleasePage: () => void;
}

const DOT_CLS: Record<DownloadState["status"], string> = {
  idle: "bg-purple-400 shadow-[0_0_6px_rgba(167,139,250,0.55)]",
  downloading: "bg-purple-400 shadow-[0_0_6px_rgba(167,139,250,0.55)] animate-pulse",
  complete: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.55)]",
  error: "bg-red-400  shadow-[0_0_5px_rgba(248,113,113,0.5)]",
};

const HEADER_TITLE: Record<DownloadState["status"], string> = {
  idle: "업데이트 알림",
  downloading: "업데이트 중...",
  complete: "업데이트 완료",
  error: "설치 실패",
};

const CLS = {
  body: "flex-1 px-4  ",
  footer: "px-4 py-3 flex-shrink-0",

  verRow: "text-sm flex justify-between items-center p-2 mb-1" + "text-sm",
  errRow: "text-sm flex justify-between items-center p-2 mb-1" + "text-sm",
  verLabel: "text-white/[0.5] ",
  verCur: "text-slate-400  tabular-nums",
  verNew: "text-green-400  tabular-nums",

  dividerLine: "flex-1 h-px bg-white/[0.07]",
  dividerText: "text-[10.5px] font-semibold tracking-[0.07em] uppercase whitespace-nowrap",
} as const;

const Divider = ({ label, labelCls }: { label: string; labelCls: string }) => (
  <div className="flex items-center gap-2 mb-3 ">
    <div className={CLS.dividerLine} />
    <span className={`${CLS.dividerText} ${labelCls}`}>{label}</span>
    <div className={CLS.dividerLine} />
  </div>
);

const VersionRows = ({ current, latest }: { current: string; latest: string }) => (
  <>
    <div className={CLS.verRow}>
      <span className={CLS.verLabel}>현재</span>
      <span className={CLS.verCur}>v{current}</span>
    </div>
    <div className={CLS.verRow}>
      <span className={CLS.verLabel}>최신</span>
      <span className={CLS.verNew}>v{latest}</span>
    </div>
  </>
);

export const UpdatePanel = ({
  updateInfo,
  downloadState,
  onClose,
  onUpdate,
  onOpenReleasePage,
  onRetryDownload,
  onReady,
}: Props) => {
  const [visible, setVisible] = useState(true);
  const prevStatus = useRef(downloadState.status);

  useEffect(() => {
    onReady?.();
  }, []);

  useEffect(() => {
    if (prevStatus.current === downloadState.status) return;
    prevStatus.current = downloadState.status;
    setVisible(false);
    const t = setTimeout(() => {
      setVisible(true);
    }, 150);
    return () => {
      clearTimeout(t);
      setVisible(true);
    };
  }, [downloadState.status]);

  const { status } = downloadState;
  const showClose = status !== "downloading" && status !== "complete";

  return (
    <div
      className="w-75   overflow-hidden font-semibold flex flex-col transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0 }}>
      <div className="flex items-center gap-2.5 px-4 py-3 shrink-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${DOT_CLS[status]}`} />
        <span className="flex-1 text-sm ">{HEADER_TITLE[status]}</span>
        {showClose && (
          <Button
            variant="ghost"
            onClick={onClose}>
            <X className="scale-125" />
          </Button>
        )}
      </div>
      {status === "idle" && !updateInfo && (
        <>
          <div className={CLS.body}>
            <Divider
              label="버전 확인 실패"
              labelCls="text-red-400/50"
            />
            <div className={CLS.verRow}>
              <span className={CLS.verLabel}>현재</span>
              <span className={CLS.verCur}>알 수 없음</span>
            </div>
            <div className={CLS.errRow}>
              <span className={CLS.verLabel}>오류</span>
              <span className="text-red-300">네트워크 또는 권한 문제</span>
            </div>
          </div>
          <div className={`${CLS.footer} flex gap-2`}>
            <Button
              onClick={onClose}
              className="flex-1 p-4 w-20 opacity-60 hover:opacity-100 transition-opacity">
              닫기
            </Button>
            <Button
              onClick={onOpenReleasePage}
              className="flex-1 bg-/70 transition-colors p-4 w-20">
              수동 설치
            </Button>
          </div>
        </>
      )}

      {status === "idle" && updateInfo && (
        <>
          <div className={CLS.body}>
            <Divider
              label={updateInfo.isPrerelease ? "베타 버전" : "정식 릴리즈"}
              labelCls={updateInfo.isPrerelease ? "text-white/[0.4]" : "text-purple-400"}
            />
            <VersionRows
              current={updateInfo.currentVersion}
              latest={updateInfo.latestVersion}
            />
          </div>
          <div className={`${CLS.footer} flex gap-2`}>
            <Button
              onClick={onClose}
              size="lg"
              className="p-4 w-20 opacity-60 hover:opacity-100 transition-opacity flex-1">
              나중에
            </Button>
            <Button
              onClick={onUpdate}
              className="bg-purple-600 hover:bg-purple-700 transition-colors p-4 w-20 flex-1">
              업데이트
            </Button>
          </div>
        </>
      )}

      {status === "downloading" && (
        <>
          <div className={CLS.body}>
            <Divider
              label="다운로드 중"
              labelCls="text-purple-400/60"
            />
            {updateInfo && (
              <VersionRows
                current={updateInfo.currentVersion}
                latest={updateInfo.latestVersion}
              />
            )}
          </div>
          <div className={`${CLS.footer} flex flex-col gap-2`}>
            <div className="flex justify-between text-sm">
              <span className="text-white/[0.28]">설치 중에는 앱을 종료하지 마세요</span>
              <span className="text-purple-400  tabular-nums">{downloadState.percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-600 to-purple-400
                           transition-[width] duration-300 ease-out"
                style={{ width: `${downloadState.percent}%` }}
              />
            </div>
          </div>
        </>
      )}

      {status === "complete" && (
        <div className="flex-1 py-10 flex flex-col items-center justify-center gpa-1.25">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center mb-1
                          bg-green-400/10 border border-green-400/20 text-green-400 text-[15px]">
            ✓
          </div>
          <p className="text-sm  text-slate-200">다운로드가 완료되었습니다</p>
          <p className="text-sm text-white/45">잠시 후 앱이 자동으로 재실행됩니다</p>
        </div>
      )}

      {status === "error" && (
        <>
          <div className={CLS.body}>
            <Divider
              label="설치 오류"
              labelCls="text-red-400/50 "
            />
            {updateInfo && (
              <div className={CLS.verRow}>
                <span className={CLS.verLabel}>현재</span>
                <span className={CLS.verCur}>v{updateInfo.currentVersion}</span>
              </div>
            )}
            <div className={CLS.errRow}>
              <span className={CLS.verLabel}>오류</span>
              <span className="text-red-300">네트워크 또는 권한 문제</span>
            </div>
          </div>
          <div className={`${CLS.footer} flex gap-2`}>
            <Button
              onClick={onOpenReleasePage}
              size="lg"
              className="flex-1 p-4 w-20 opacity-60 hover:opacity-100 transition-opacity">
              수동 설치
            </Button>
            <Button
              onClick={onRetryDownload}
              className="flex-1 bg-destructive hover:bg-destructive/70 transition-colors p-4 w-20">
              다시 시도
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
