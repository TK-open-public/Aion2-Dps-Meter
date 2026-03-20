import { memo } from "react";
import bossIcon from "../assets/bossIcon.png";

interface Props {
  targetName: string;
}

export const TargetInfo = memo(({ targetName }: Props) => {
  if (!targetName) return null;

  return (
    <div className="px-2 py-3 relative h-full flex items-center gap-3">
      <div className="flex gap-3 items-center">
        <img
          src={bossIcon}
          className="w-8 h-7"
        />
        <div className="text-xl text-shadow-lg font-bold">{targetName}</div>
      </div>
      <div className="flex items-center gap-2 ml-auto ">
        <div className="text-xl text-shadow-lg font-bold">23,423,679</div>
      </div>
    </div>
  );
});
