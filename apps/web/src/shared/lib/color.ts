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

/**
 * Applies (or clears) a school's chosen background_color as --background,
 * paired with a computed --foreground (reusing foregroundOklchFor, same
 * pairing already done for --primary/--primary-foreground) so body text
 * stays readable regardless of which color was picked. One override,
 * applied identically in light and dark mode — same mode-agnostic
 * precedent primary_color already established, not new behavior invented
 * just for this field.
 *
 * Exported as one shared function, not inlined in a useEffect, so both
 * SchoolThemeProvider (the committed, saved value) and the Settings
 * page's live-preview-before-save can call the exact same apply/clear
 * logic — a live preview that used different logic than the real one
 * would risk showing something that doesn't match what Save actually
 * produces.
 */
export function applySchoolBackground(hex: string | null): void {
  const root = document.documentElement;

  if (hex) {
    const triple = hexToOklchTriple(hex);
    if (triple) {
      root.style.setProperty('--background', triple);
      root.style.setProperty('--foreground', foregroundOklchFor(hex));
      return;
    }
  }

  root.style.removeProperty('--background');
  root.style.removeProperty('--foreground');
}
