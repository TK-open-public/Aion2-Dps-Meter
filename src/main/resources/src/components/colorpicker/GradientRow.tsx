import { ColorSwatch } from "./ColorSwatch";

interface GradientRowProps {
  label: string;
  value: [string, string];
  onChange: (v: [string, string]) => void;
}

export function GradientRow({ label, value, onChange }: GradientRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs opacity-60 flex-1">{label}</span>
      <div
        className="w-10 h-6.5 rounded  border-none shrink-0 mr-2"
        style={{ background: `linear-gradient(to right, ${value[0]}, ${value[1]})` }}
      />
      <ColorSwatch
        label=""
        value={value[0]}
        onChange={(c) => onChange([c, value[1]])}
      />
      <ColorSwatch
        label=""
        value={value[1]}
        onChange={(c) => onChange([value[0], c])}
      />
    </div>
  );
}
