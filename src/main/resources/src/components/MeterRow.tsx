import { memo } from "react";
import { getJobIconSrc } from "../utils/jobIcon";
import { formatAmount } from "@/utils/format";
import { useSettingsStore } from "@/stores/useSettingsStore";

interface Props {
  id: string;
  name: string;
  job?: string;
  dps: number;
  amount: number;
  contribution: number;
  isUser: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  topDps: number;
  rowHeight: number;
  server: number;
}
const gradients = {
  user: "linear-gradient(to right, #55c42a, #3a9e20)",
  normal: "linear-gradient(to right, #ffc837, #e8960a)",
  warning: "linear-gradient(to right, #ffa537, #7a3d00)",
  error: "linear-gradient(to right, #c24343, #5c1010)",
};
const getNameColor = (server?: number) => {
  if (!server) return "#ffffff";
  if (server >= 1001 && server <= 1021) return "#7dd3fc";
  if (server >= 2001 && server <= 2021) return "#e879f9";
  return "#ffffff";
};

export const MeterRow = memo(
  ({
    id,
    name,
    job,
    dps,
    server,
    contribution,
    isUser,
    onSelect,
    topDps,
    amount,
    rowHeight,
  }: Props) => {
    const displayMode = useSettingsStore((s) => s.displayMode);
    const nameDisplay = useSettingsStore((s) => s.nameDisplay);
    const maskedName = (name: string) => `${name[0]}***`;
    const iconSize = Math.round(rowHeight * 0.7);
    const fontSize = `${Math.max(12, Math.round(rowHeight * 0.4))}px`; // 비례 계산

    const ratio = Math.max(0, Math.min(1, dps / topDps));
    const iconSrc = getJobIconSrc(job);
    const fillGradient = isUser
      ? gradients.user
      : Number(contribution) < 3
        ? gradients.error
        : Number(contribution) < 5
          ? gradients.warning
          : gradients.normal;

    const renderStats = () => {
      switch (displayMode) {
        case "amount_dps_percent":
          return (
            <>
              <span style={{ color: "#ffe566", fontSize }}>{formatAmount(amount)}</span>
              <span style={{ color: "#ffffff", fontSize }}>{dps.toLocaleString()}/초</span>
              <span style={{ color: "#ffe566", fontSize }}>{contribution.toFixed(1)}%</span>
            </>
          );
        case "amount_percent":
          return (
            <>
              <span style={{ color: "#ffe566", fontSize }}>{formatAmount(amount)}</span>
              <span style={{ color: "#ffe566", fontSize }}>{contribution.toFixed(1)}%</span>
            </>
          );
        case "dps_percent":
        default:
          return (
            <>
              <span style={{ color: "#ffffff", fontSize }}>{dps.toLocaleString()}/초</span>
              <span style={{ color: "#ffe566", fontSize }}>{contribution.toFixed(1)}%</span>
            </>
          );
      }
    };
    const displayName = (() => {
      switch (nameDisplay) {
        case "all":
          return name;
        case "me_only":
          return isUser ? name : maskedName(name);
        case "hidden":
          return maskedName(name);
      }
    })();

    return (
      <div
        onClick={() => onSelect(id)}
        style={{ height: rowHeight }}
        className={`w-full relative  px-2 rounded-sm overflow-hidden bg-black/30 cursor-pointer `}>
        <div
          className="absolute inset-0 origin-left transition-transform duration-150 ease-out"
          style={{
            background: fillGradient,
            transform: `scaleX(${ratio})`,
          }}
        />

        <div className="relative h-full flex items-center gap-3">
          <div
            style={{ width: iconSize, height: iconSize }}
            className=" flex items-center justify-center shrink-0 ">
            {iconSrc && (
              <img
                src={iconSrc}
                draggable={false}
                className="w-full h-full object-contain"
                style={{
                  filter: "drop-shadow(0 0 3px rgba(20,20,20,0.6))",
                }}
              />
            )}
          </div>
          <span
            className=" font-bold text-shadow-meter flex-1 truncate"
            style={{ color: getNameColor(server), fontSize }}>
            {displayName}
          </span>
          <div className=" flex items-center gap-2 font-bold text-shadow-meter">
            {renderStats()}
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.dps === next.dps &&
      prev.contribution === next.contribution &&
      prev.isSelected === next.isSelected &&
      prev.topDps === next.topDps &&
      prev.name === next.name &&
      prev.job === next.job &&
      prev.rowHeight === next.rowHeight
    );
  },
);
