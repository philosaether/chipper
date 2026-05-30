/**
 * Chipper theme type definitions.
 *
 * A Hue is the minimum color set for a chip domain.
 * A ChipperTheme is a complete visual configuration.
 */

/** Minimum set of colors needed to fully style a chip of any domain. */
export interface Hue {
  /** Hue role name — matches the domain's `color` key. */
  readonly name: string;
  /** Dark text color for use on the pastel background. */
  readonly text: string;
  /** Pastel background color. */
  readonly background: string;
  /** Hover background — slightly darker/richer than background. */
  readonly hover: string;
  /**
   * Glow color for expanded/focused state on dark themes.
   * When omitted, components fall back to a neutral shadow.
   */
  readonly glow?: string;
}

/** Complete visual configuration for Chipper components. */
export interface ChipperTheme {
  readonly name: string;

  /** Surface colors. */
  readonly surface: {
    readonly bgPrimary: string;
    readonly bgSecondary: string;
    readonly bgTertiary: string;
    readonly bgElevated: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
    readonly textMuted: string;
    readonly border: string;
    readonly borderSubtle: string;
  };

  /** Accent colors — the primary interactive color family. */
  readonly accent: {
    readonly base: string;
    readonly bright: string;
    readonly dim: string;
    readonly glow: string;
  };

  /** Semantic colors. */
  readonly semantic: {
    readonly success: string;
    readonly warning: string;
    readonly error: string;
    readonly info: string;
  };

  /** Structural tokens. */
  readonly structure: {
    readonly radius: string;
    readonly radiusLarge: string;
    readonly font: string;
    readonly fontMono: string;
    readonly focusRing: string;
    readonly popupShadow: string;
    readonly transition: string;
  };

  /** Chip color hues. Keyed by hue role name. */
  readonly hues: Record<string, Hue>;

  /**
   * Fallback hue name. When a domain references a hue role not in this
   * theme's hues map, this hue is used instead. Defaults to the first
   * hue in the hues map — a misconfigured palette gets "wrong color"
   * rather than "no color."
   */
  readonly fallbackHue?: string;
}
