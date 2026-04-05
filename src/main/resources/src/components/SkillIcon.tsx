import { useState } from "react";
import { getSkillIconSrc } from "@/utils/icons";

interface Props {
  code?: string; 
  size?: number;
}

export const SkillIcon = ({ code,  size = 24 }: Props) => {
  const [failed, setFailed] = useState(false);
  const src = getSkillIconSrc(code);


  if (!src || failed) {
    return (
      <div
        className="shrink-0 rounded-md bg-white/10 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] opacity-40">?</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-md object-contain"
      onError={() => setFailed(true)}
    />
  );
};