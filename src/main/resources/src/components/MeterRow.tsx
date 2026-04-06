import { memo } from "react";
import { getJobIconSrc } from "@/utils/icons";
import { formatAmount } from "@/utils/format";
import { useSettingsStore } from "@/stores/useSettingsStore";

interface Props {
  id: number;
  name: string;
  job?: string;
  dps: number;
  amount: number;
  contribution: number;
  isUser: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  topDps: number;
  rowHeight: number;
  server: number;
  power: number;
}

const makeGradient = (from: string, to: string) => `linear-gradient(to right, ${from}, ${to})`;

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
    power,
  }: Props) => {
    const displayMode = useSettingsStore((s) => s.displayMode);
    const nameDisplay = useSettingsStore((s) => s.nameDisplay);
    const theme = useSettingsStore((s) => s.theme);
    const showPower = useSettingsStore((s) => s.showPower);

    const gradients = {
      user: makeGradient(...theme.userBar),
      normal: makeGradient(...theme.normalBar),
      warning: makeGradient(...theme.warningBar),
      error: makeGradient(...theme.errorBar),
    };

    const getNameColor = (server?: number) => {
      if (!server) return theme.serverDefaultColor;
      if (server >= 1001 && server <= 1021) return theme.serverAColor;
      if (server >= 2001 && server <= 2021) return theme.serverBColor;
      return theme.serverDefaultColor;
    };

    const maskedName = (name: string) => `${name[0]}***`;
    const iconSize = Math.round(rowHeight * 0.7);
    const fontSize = `${Math.max(10, Math.floor(rowHeight * 0.4))}px`;

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
      const amountColor = theme.meterStatAmount;
      const dpsColor = theme.meterStatDps;
      const percentColor = theme.meterStatPercent;
      switch (displayMode) {
        case "amount_dps_percent":
          return (
            <>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: amountColor, fontSize }}>
                {formatAmount(amount)}
              </span>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: dpsColor, fontSize }}>
                {dps.toLocaleString()}/초
              </span>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: percentColor, fontSize }}>
                {contribution.toFixed(1)}%
              </span>
            </>
          );
        case "amount_percent":
          return (
            <>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: amountColor, fontSize }}>
                {formatAmount(amount)}
              </span>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: percentColor, fontSize }}>
                {contribution.toFixed(1)}%
              </span>
            </>
          );
        case "amount_full_dps_percent":
          return (
            <>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: amountColor, fontSize }}>
                {amount.toLocaleString()}
              </span>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: dpsColor, fontSize }}>
                {dps.toLocaleString()}/초
              </span>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: percentColor, fontSize }}>
                {contribution.toFixed(1)}%
              </span>
            </>
          );
        case "amount_full_percent":
          return (
            <>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: amountColor, fontSize }}>
                {amount.toLocaleString()}
              </span>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: percentColor, fontSize }}>
                {contribution.toFixed(1)}%
              </span>
            </>
          );
        case "dps_percent":
        default:
          return (
            <>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: dpsColor, fontSize }}>
                {dps.toLocaleString()}/초
              </span>
              <span
                className="text-end whitespace-nowrap "
                style={{ color: percentColor, fontSize }}>
                {contribution.toFixed(1)}%
              </span>
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
        className={`w-full relative px-2 rounded-sm overflow-hidden bg-black/30 cursor-pointer`}>
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
            className="flex items-center justify-center shrink-0">
            {iconSrc && (
              <img
                src={iconSrc}
                draggable={false}
                className="w-full h-full object-contain"
                style={{ filter: "drop-shadow(0 0 3px rgba(20,20,20,0.6))" }}
              />
            )}
          </div>
          <div className="flex gap-1.5 flex-1 items-center">
            <span
              className="font-bold text-shadow-meter truncate "
              style={{ color: getNameColor(server), fontSize }}>
              {displayName}
            </span>
            {showPower && power > 0 && (
              <div
                className={`bg-black/30 px-2     text-shadow-meter flex items-center rounded-xl `}>
                <span
                  className="text-[#10f1e2] font-semibold  py-1 leading-none"
                  style={{
                    fontSize: `${parseInt(fontSize) - 2}px`,
                  }}>{`${(power / 1000).toFixed(1)}k`}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 font-bold text-shadow-meter">{renderStats()}</div>
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
