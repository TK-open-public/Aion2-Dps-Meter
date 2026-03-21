import { useEffect } from "react";
import type { UpdateInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  updateInfo: UpdateInfo;
  onClose: () => void;
  onUpdate: () => void;
  onReady?: () => void;
}

export const UpdatePanel = ({ updateInfo, onClose, onUpdate, onReady }: Props) => {
  const label = updateInfo.isPrerelease ? "베타" : "정식";
  useEffect(() => {
    onReady?.();
  }, []);

  return (
    <div className=" font-bold rounded-lg py-4 px-7 w-[320px]">
      <div className="flex items-center pb-3 border-b border-white/10">
        <span>업데이트 알림</span>
        <Button
          variant="ghost"
          className="ml-auto "
          onClick={onClose}>
          <X className="scale-125"></X>
        </Button>
      </div>

      <div className="py-4 space-y-2 text-sm  opacity-80 border-b border-white/10">
        <p className="pb-3 font-semibold">
          신규 <span className="text-yellow-400 font-bold">{label}</span> 업데이트가 있습니다!
        </p>
        <div className="flex justify-between">
          <span className="opacity-70">현재 버전</span>
          <span>v.{updateInfo.currentVersion}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">최신 버전</span>
          <span className="text-green-400">v.{updateInfo.latestVersion}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          onClick={onClose}
          size="lg"
          className=" p-4 w-20  opacity-60 hover:opacity-100 transition-opacity">
          나중에
        </Button>
        <Button
          onClick={onUpdate}
          size="lg"
          className="p-4 w-20 bg-purple-600 hover:bg-purple-700  rounded-md transition-colors">
          업데이트
        </Button>
      </div>
    </div>
  );
};
