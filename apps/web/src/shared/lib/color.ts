/**
 * globals.css defines shadcn tokens (--primary etc.) as bare OKLCH "L C H"
 * triples, not hex/rgb — Tailwind wraps them as `oklch(var(--x) /
 * <alpha-value>)` (see tailwind.config.ts). A school's chosen hex color
 * has to be converted into that same triple format to actually override
 * the token, plain `--primary: #rrggbb` would not match what the rest of
 * the design system expects.
 */
export function hexToOklchTriple(hex: string): string | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1] ?? '', 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;

  return `${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)}`;
}

/** Chooses readable foreground text (near-black/near-white, matching the
 * existing token values) against a given hex background. */
export function foregroundOklchFor(hex: string): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return '0.985 0 0';

  const int = parseInt(match[1] ?? '', 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  // Standard relative luminance (sRGB, gamma-uncorrected approximation is
  // fine here — this only needs to pick a side, not be colorimetrically
  // exact).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? '0.145 0 0' : '0.985 0 0';
}
