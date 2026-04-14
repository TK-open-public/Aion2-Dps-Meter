import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsItem } from "./SettingsItem";
import { SettingsRow } from "./SettingsRow";

interface Props {
  onClose: () => void;
  onReady?: () => void;
}

export const ServerSettings = ({ onClose, onReady }: Props) => {
  const [serverType, setServerType] = useState<string>(localStorage.getItem('serverType') || 'KOREA');

  const handleSave = () => {
    localStorage.setItem('serverType', serverType);
    // 通知后端更改服务器类型
    (window as any).javaBridge?.setServerType(serverType);
    onClose();
  };

  return (
    <div className="font-bold relative rounded-lg py-3 px-7 w-100">
      <div className="flex items-center pb-3 border-b border-white/10">
        <span>服务器设置</span>
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="max-h-170 py-2 -mr-4 pr-4 overflow-y-auto">
        <SettingsItem>
          <SettingsRow
            title="服务器类型"
            description="选择游戏服务器类型">
            <Select
              value={serverType}
              onValueChange={setServerType}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10 ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KOREA">韩服</SelectItem>
                <SelectItem value="TAIWAN">台服</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsItem>

        <SettingsItem>
          <div className="p-4 bg-white/5 rounded-md">
            <p className="text-sm text-white/70">
              注意：切换服务器类型后，需要重启程序才能生效。
              台服数据正在完善中，部分功能可能与韩服有所不同。
            </p>
          </div>
        </SettingsItem>
      </div>

      <div className="pt-4 flex justify-end gap-2 w-full">
        <Button
          onClick={onClose}
          size="lg"
          className="p-4 w-20 opacity-60 hover:opacity-100 transition-opacity">
          取消
        </Button>
        <Button
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700 transition-colors p-4 w-20">
          保存
        </Button>
      </div>
    </div>
  );
};