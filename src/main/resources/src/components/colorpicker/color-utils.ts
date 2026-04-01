export type Rgba = { r: number; g: number; b: number; a: number };
export type Hsva = { h: number; s: number; v: number; a: number };

export function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function roundTo(v: number, digits = 3) {
  const p = 10 ** digits;
  return Math.round(v * p) / p;
}

function toByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function hexToRgba(hex: string): Rgba | null {
  const raw = hex.trim();
  if (!raw.startsWith("#")) return null;
  const h = raw.slice(1);

  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }

  if (/^[0-9a-fA-F]{8}$/.test(h)) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = parseInt(h.slice(6, 8), 16) / 255;
    return { r, g, b, a };
  }

  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b, a: 1 };
  }

  if (/^[0-9a-fA-F]{4}$/.test(h)) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    const a = parseInt(h[3] + h[3], 16) / 255;
    return { r, g, b, a };
  }

  return null;
}

export function rgbaToHex({ r, g, b }: Rgba): string {
  return `#${[r, g, b]
    .map((c) => toByte(c).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function parseRgbLike(input: string): Rgba | null {
  const s = input.trim();
  const m = s.match(
    /^rgba?\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)(?:\s*,\s*([+-]?\d+(?:\.\d+)?))?\s*\)$/i,
  );
  if (!m) return null;
  const r = toByte(Number(m[1]));
  const g = toByte(Number(m[2]));
  const b = toByte(Number(m[3]));
  const a = m[4] === undefined ? 1 : clamp(Number(m[4]), 0, 1);
  return { r, g, b, a };
}

export function parseColorString(input: string): { rgba: Rgba; preferredFormat: "hex" | "rgba" } | null {
  const hex = hexToRgba(input);
  if (hex) return { rgba: hex, preferredFormat: "hex" };
  const rgb = parseRgbLike(input);
  if (rgb) return { rgba: rgb, preferredFormat: "rgba" };
  return null;
}

export function rgbToHsva({ r, g, b, a }: Rgba): Hsva {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0);
        break;
      case gg:
        h = (bb - rr) / d + 2;
        break;
      default:
        h = (rr - gg) / d + 4;
        break;
    }
    h *= 60;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v, a };
}

export function hsvaToRgb({ h, s, v, a }: Hsva): Rgba {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let rr = 0,
    gg = 0,
    bb = 0;

  if (hh < 60) [rr, gg, bb] = [c, x, 0];
  else if (hh < 120) [rr, gg, bb] = [x, c, 0];
  else if (hh < 180) [rr, gg, bb] = [0, c, x];
  else if (hh < 240) [rr, gg, bb] = [0, x, c];
  else if (hh < 300) [rr, gg, bb] = [x, 0, c];
  else [rr, gg, bb] = [c, 0, x];

  return {
    r: toByte((rr + m) * 255),
    g: toByte((gg + m) * 255),
    b: toByte((bb + m) * 255),
    a: clamp(a, 0, 1),
  };
}

export function rgbaToCss({ r, g, b, a }: Rgba): string {
  const aa = roundTo(clamp(a, 0, 1), 3);
  return `rgba(${toByte(r)}, ${toByte(g)}, ${toByte(b)}, ${aa})`;
}

export function buildCheckerboardCss() {
  return {
    backgroundImage:
      "linear-gradient(45deg, rgba(255,255,255,0.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.18) 75%)",
    backgroundSize: "10px 10px",
    backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
  } as const;
}
