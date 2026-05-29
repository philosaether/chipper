/**
 * createHue — convenience factory for Hue objects.
 *
 * Auto-computes hover by mixing 12% of text into background (same formula
 * as the SASS chip-colors() mixin). Color mixing uses simple sRGB channel
 * interpolation — no external color library needed.
 */

import type { Hue } from './types';

/** Parse a hex color string (#RRGGBB or #RGB) into [r, g, b] channels. */
function parseHex(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  let r: number, g: number, b: number;
  if (cleaned.length === 3) {
    r = parseInt(cleaned.charAt(0) + cleaned.charAt(0), 16);
    g = parseInt(cleaned.charAt(1) + cleaned.charAt(1), 16);
    b = parseInt(cleaned.charAt(2) + cleaned.charAt(2), 16);
  } else {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [r, g, b];
}

/** Format [r, g, b] channels back to a #RRGGBB hex string. */
function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(255, n)));
  const rr = clamp(r).toString(16).padStart(2, '0');
  const gg = clamp(g).toString(16).padStart(2, '0');
  const bb = clamp(b).toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}`;
}

/**
 * Mix two colors in sRGB space. Matches SASS color.mix() behavior:
 * result = text * weight + bg * (1 - weight).
 */
function mixColors(
  textHex: string,
  bgHex: string,
  weight: number,
): string {
  const [tr, tg, tb] = parseHex(textHex);
  const [br, bg, bb] = parseHex(bgHex);
  return toHex(
    tr * weight + br * (1 - weight),
    tg * weight + bg * (1 - weight),
    tb * weight + bb * (1 - weight),
  );
}

/**
 * Create a Hue with auto-computed hover color.
 *
 * Hover is computed by mixing 12% of text into background — the same
 * formula the SASS `chip-colors()` mixin uses.
 *
 * @param name - Hue role name (matches domain's `color` key)
 * @param text - Dark text color (hex)
 * @param background - Pastel background color (hex)
 * @param options - Optional glow color for dark themes
 */
export function createHue(
  name: string,
  text: string,
  background: string,
  options?: { glow?: string },
): Hue {
  return {
    name,
    text,
    background,
    hover: mixColors(text, background, 0.12),
    glow: options?.glow,
  };
}
