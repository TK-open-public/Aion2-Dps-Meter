interface Props {
  isInCombat: boolean;
  combatTime: string;
}

export const CombatTimer = ({ isInCombat, combatTime }: Props) => {
  return (
    <div className="flex items-center gap-2 px-1 pt-4">
      <div
        className="w-2 h-2 rounded-full transition-colors duration-300"
        style={{
          background: isInCombat ? "#55c42a" : "#6b7280",
          boxShadow: isInCombat ? "0 0 6px #55c42a" : "none",
        }}
      />
      <span
        className="text-xs font-bold"
        style={{ color: isInCombat ? "#55c42a" : "#6b7280" }}>
        {isInCombat ? "전투 중" : "대기 중"}
      </span>
      <span
        className="ml-auto text-xs font-bold"
        style={{ color: "#a0a0a0" }}>
        {combatTime}
      </span>
    </div>
  );
};
