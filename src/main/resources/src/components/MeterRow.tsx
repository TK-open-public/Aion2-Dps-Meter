import { memo } from "react";
import { getJobIconSrc } from "../utils/jobIcon";

interface Props {
  id: string;
  name: string;
  job?: string;
  dps: number;
  contribution: number;
  isUser: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  topDps: number;
}
const gradients = {
  user: "linear-gradient(to right, #55c42a, #3a9e20)",
  normal: "linear-gradient(to right, #ffc837, #e8960a)",
  warning: "linear-gradient(to right, #ffa537, #7a3d00)",
  error: "linear-gradient(to right, #c24343, #5c1010)",
};
export const MeterRow = memo(
  ({ id, name, job, dps, contribution, isUser,  onSelect, topDps }: Props) => {
    const ratio = Math.max(0, Math.min(1, dps / topDps));
    const iconSrc = getJobIconSrc(job);
    const fillGradient = isUser
      ? gradients.user
      : Number(contribution) < 3
        ? gradients.error
        : Number(contribution) < 5
          ? gradients.warning
          : gradients.normal;

    return (
      <div
        onClick={() => onSelect(id)}
        className={`w-full relative h-10 px-2 rounded-sm overflow-hidden bg-black/30 cursor-pointer `}>
        <div
          className="absolute inset-0 origin-left transition-transform duration-150 ease-out"
          style={{
            background: fillGradient,
            transform: `scaleX(${ratio})`,
          }}
        />

        <div className="relative h-full flex items-center gap-3">
          <div className="w-8 h-7 flex items-center justify-center shrink-0">
            {iconSrc && (
              <img
                src={iconSrc}
                draggable={false}
                className="w-full h-full object-contain "
              />
            )}
          </div>

          <span className=" text-lg font-bold text-shadow-lg text-white">{name}</span>

          <div className="ml-auto flex items-center gap-2 font-bold  text-dps text-shadow-lg">
            <span>{dps.toLocaleString()}/초</span>
            <span className="">{contribution.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  },
);
