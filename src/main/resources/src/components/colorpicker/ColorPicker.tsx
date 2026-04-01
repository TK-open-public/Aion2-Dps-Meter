import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import {
  buildCheckerboardCss,
  clamp,
  hsvaToRgb,
  parseColorString,
  rgbaToCss,
  rgbaToHex,
  rgbToHsva,
  type Hsva,
} from "./color-utils";

const PRESETS = [
  "#ff4d4d",
  "#ff8c42",
  "#ffd166",
  "#06d6a0",
  "#55c42a",
  "#3a9e20",
  "#4ecdc4",
  "#45b7d1",
  "#6c63ff",
  "#a855f7",
  "#f3a5ff",
  "#ff6b9d",
  "#ffffff",
  "#95ddff",
  "#ffc837",
  "#e8960a",
] as const;

function useDrag({
  onMove,
  onEnd,
}: {
  onMove: (x: number, y: number, rect: DOMRect) => void;
  onEnd?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      let raf = 0;
      let latest: PointerEvent | null = null;

      const flush = () => {
        raf = 0;
        if (!latest) return;
        onMove(latest.clientX, latest.clientY, rect);
      };

      const move = (ev: PointerEvent) => {
        latest = ev;
        if (raf) return;
        raf = window.requestAnimationFrame(flush);
      };

      onMove(e.nativeEvent.clientX, e.nativeEvent.clientY, rect);

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        if (raf) window.cancelAnimationFrame(raf);
        onEnd?.();
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [onMove, onEnd],
  );

  return { ref, onPointerDown: handlePointerDown };
}

function ColorSlider({
  value,
  min,
  max,
  step,
  onValueChange,
  onValueCommit,
  trackStyle,
  thumbStyle,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (v: number) => void;
  onValueCommit?: (v: number) => void;
  trackStyle?: React.CSSProperties;
  thumbStyle?: React.CSSProperties;
}) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onValueChange(v[0] ?? value)}
      onValueCommit={onValueCommit ? (v) => onValueCommit(v[0] ?? value) : undefined}
      className="relative flex w-full touch-none items-center select-none">
      <SliderPrimitive.Track
        className="relative grow overflow-hidden rounded-full h-2 ring-1 ring-white/10 bg-transparent"
        style={trackStyle}>
        <SliderPrimitive.Range className="absolute h-full opacity-0" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="relative block size-3 shrink-0 rounded-full border border-white/70 bg-white ring-2 ring-black/30 outline-hidden"
        style={thumbStyle}
      />
    </SliderPrimitive.Root>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const initial = useMemo(() => parseColorString(value) ?? parseColorString("#ffffff")!, [value]);
  const [hsva, setHsva] = useState<Hsva>(() => rgbToHsva(initial.rgba));
  const [preferredFormat, setPreferredFormat] = useState<"hex" | "rgba">(() => initial.preferredFormat);
  const [textInput, setTextInput] = useState(() =>
    initial.preferredFormat === "hex" ? rgbaToHex(initial.rgba) : rgbaToCss(initial.rgba),
  );

  useEffect(() => {
    const parsed = parseColorString(value);
    if (!parsed) return;
    const next = rgbToHsva(parsed.rgba);
    setHsva(next);
    setPreferredFormat(parsed.preferredFormat);
    setTextInput(parsed.preferredFormat === "hex" ? rgbaToHex(parsed.rgba) : rgbaToCss(parsed.rgba));
  }, [value]);

  const formatOut = useCallback(
    (next: Hsva, formatHint?: "hex" | "rgba") => {
      const rgb = hsvaToRgb(next);
      const format = formatHint ?? (rgb.a < 1 ? "rgba" : preferredFormat);
      return format === "hex" && rgb.a >= 1 ? rgbaToHex(rgb) : rgbaToCss(rgb);
    },
    [preferredFormat],
  );

  const emit = useCallback(
    (next: Hsva, formatHint?: "hex" | "rgba") => {
      onChange(formatOut(next, formatHint));
    },
    [onChange, formatOut],
  );

  const commitTextFrom = useCallback(
    (next: Hsva, formatHint?: "hex" | "rgba") => {
      setTextInput(formatOut(next, formatHint));
    },
    [formatOut],
  );

  const svDrag = useDrag({
    onMove: useCallback(
      (x, y, rect) => {
        const s = clamp((x - rect.left) / rect.width);
        const v = clamp(1 - (y - rect.top) / rect.height);
        const next: Hsva = { ...hsva, s, v };
        setHsva(next);
        emit(next);
      },
      [hsva, emit],
    ),
    onEnd: useCallback(() => commitTextFrom(hsva), [commitTextFrom, hsva]),
  });

  const handleTextInputChange = (raw: string) => {
    setTextInput(raw);
    const parsed = parseColorString(raw);
    if (!parsed) return;
    setPreferredFormat(parsed.preferredFormat);
    const next = rgbToHsva(parsed.rgba);
    setHsva(next);
    emit(next, parsed.preferredFormat);
  };

  const rgb = useMemo(() => hsvaToRgb(hsva), [hsva]);
  const currentHex = useMemo(() => rgbaToHex(rgb), [rgb]);
  const hueRgb = useMemo(() => hsvaToRgb({ h: hsva.h, s: 1, v: 1, a: 1 }), [hsva.h]);
  const hueHex = useMemo(() => rgbaToHex(hueRgb), [hueRgb]);
  const alpha = hsva.a;
  const alphaPercent = Math.round(alpha * 100);

  const setHue = (h: number) => {
    const next: Hsva = { ...hsva, h: clamp(h, 0, 360) };
    setHsva(next);
    emit(next);
  };

  const setAlpha = (a01: number) => {
    const next: Hsva = { ...hsva, a: clamp(a01, 0, 1) };
    setHsva(next);
    emit(next, next.a < 1 ? "rgba" : undefined);
  };

  const setPreset = (preset: string) => {
    const parsed = parseColorString(preset);
    if (!parsed) return;
    setPreferredFormat("hex");
    const next = rgbToHsva(parsed.rgba);
    setHsva(next);
    emit({ ...next, a: 1 }, "hex");
    commitTextFrom({ ...next, a: 1 }, "hex");
  };

  const checker = useMemo(() => buildCheckerboardCss(), []);


  return (
    <div className="w-56 select-none">
      <div
        {...svDrag}
        ref={svDrag.ref}
        className="relative w-full cursor-crosshair rounded-lg overflow-hidden ring-1 ring-white/10"
        style={{
          height: 140,
          background: `
      linear-gradient(to top, #000, transparent),
      linear-gradient(to right, #fff, transparent),
      ${hueHex}
    `,
        }}>
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${hsva.s * 100}%`,
            top: `${(1 - hsva.v) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}>
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg"
            style={{
              background: rgbaToCss({ ...rgb, a: 1 }),
              boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="relative w-7 h-7 rounded-md shrink-0 overflow-hidden ring-1 ring-white/10" style={checker}>
          <div className="absolute inset-0" style={{ background: rgbaToCss(rgb) }} />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => {
              setPreferredFormat("hex");
              const out = rgbaToHex(rgb);
              setTextInput(out);
              emit({ ...hsva, a: 1 }, "hex");
            }}
            className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
              preferredFormat === "hex"
                ? "bg-purple-500/25 border-purple-500/40 text-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            }`}>
            HEX
          </button>
          <button
            type="button"
            onClick={() => {
              setPreferredFormat("rgba");
              const out = rgbaToCss(rgb);
              setTextInput(out);
              emit(hsva, "rgba");
            }}
            className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
              preferredFormat === "rgba"
                ? "bg-purple-500/25 border-purple-500/40 text-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            }`}>
            RGBA
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/50">Hue</span>
          <span className="text-[10px] text-white/50">{Math.round(hsva.h)}°</span>
        </div>
        <ColorSlider
          value={hsva.h}
          min={0}
          max={360}
          step={1}
          onValueChange={setHue}
          onValueCommit={(v) => commitTextFrom({ ...hsva, h: v })}
          trackStyle={{
            background:
              "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          }}
          thumbStyle={{
            background: hueHex,
          }}
        />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/50">Alpha</span>
          <span className="text-[10px] text-white/50">{alphaPercent}%</span>
        </div>
        <ColorSlider
          value={alpha * 100}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => setAlpha(v / 100)}
          onValueCommit={(v) => {
            const next = { ...hsva, a: v / 100 };
            commitTextFrom(next, next.a < 1 ? "rgba" : undefined);
          }}
          thumbStyle={{
            background: rgbaToCss(rgb),
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 px-2.5 py-2 rounded-md bg-white/5 border border-white/10">
        <input
          value={textInput}
          onChange={(e) => handleTextInputChange(e.target.value)}
          spellCheck={false}
          className="flex-1 text-xs bg-transparent border-none outline-none tabular-nums"
          style={{ color: "rgba(255,255,255,0.85)" }}
        />
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: currentHex }} />
      </div>

      <div className="mt-3 grid grid-cols-8 gap-1.5">
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setPreset(c)}
            className="h-5 rounded-md ring-1 ring-white/10 hover:ring-white/25 transition-[box-shadow,transform] active:scale-95"
            style={{ background: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

