import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "./ColorPicker";
import { useState } from "react";

interface ColorSwatchProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}
export function ColorSwatch({ label, value, onChange }: ColorSwatchProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2">
      {label && <span className="text-xs opacity-60 flex-1">{label}</span>}
      <Popover
        open={open}
        onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="group relative w-7 h-7 rounded-md cursor-pointer transition-transform border-none"
            style={{ background: value }}
            title={value}
          />
        </PopoverTrigger>
        {/* ✅ open일 때만 ColorPicker 마운트 */}
        {open && (
          <PopoverContent
            align="end"
            side="top"
            className="w-auto p-3 bg-[rgba(18,18,28,0.96)] backdrop-blur-md">
            <ColorPicker
              value={value}
              onChange={onChange}
            />
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
