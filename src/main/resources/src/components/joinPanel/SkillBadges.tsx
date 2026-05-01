import { SkillIcon } from "../SkillIcon";
import { getClassColor } from "@/utils/classColor";

interface SkillBadge {
  name: string;
  code: string;
  lv: number;
}

export const SkillBadges = ({ badges, job }: { badges: SkillBadge[]; job?: string }) => {
  const badgeClass = getClassColor(job);

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map(({ code, name, lv }) => (
        <div
          key={code}
          className={`${badgeClass} flex items-center text-xs px-2 py-1 gap-2 rounded-xl`}>
          <SkillIcon code={code} size={14} />
          <span className="text-shadow-meter">{name} Lv{lv}</span>
        </div>
      ))}
    </div>
  );
};