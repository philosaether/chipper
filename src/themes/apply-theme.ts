/**
 * Runtime theme switching — applyTheme(), clearTheme(), themeToProperties().
 *
 * Sets CSS custom properties on a container element to override the
 * SCSS cascade. Framework-agnostic — no React dependency.
 */

import type { ChipperTheme, Hue } from './types';

/** All non-hue CSS property names that a theme sets. */
const SURFACE_KEYS: ReadonlyArray<[keyof ChipperTheme['surface'], string]> = [
  ['bgPrimary', '--chipper-bg-primary'],
  ['bgSecondary', '--chipper-bg-secondary'],
  ['bgTertiary', '--chipper-bg-tertiary'],
  ['bgElevated', '--chipper-bg-elevated'],
  ['textPrimary', '--chipper-text-primary'],
  ['textSecondary', '--chipper-text-secondary'],
  ['textMuted', '--chipper-text-muted'],
  ['border', '--chipper-border'],
  ['borderSubtle', '--chipper-border-subtle'],
];

const ACCENT_KEYS: ReadonlyArray<[keyof ChipperTheme['accent'], string]> = [
  ['base', '--chipper-accent'],
  ['bright', '--chipper-accent-bright'],
  ['dim', '--chipper-accent-dim'],
  ['glow', '--chipper-accent-glow'],
];

const SEMANTIC_KEYS: ReadonlyArray<[keyof ChipperTheme['semantic'], string]> = [
  ['success', '--chipper-success'],
  ['warning', '--chipper-warning'],
  ['error', '--chipper-error'],
  ['info', '--chipper-info'],
];

const STRUCTURE_KEYS: ReadonlyArray<[keyof ChipperTheme['structure'], string]> = [
  ['radius', '--chipper-radius'],
  ['radiusLarge', '--chipper-radius-lg'],
  ['font', '--chipper-font'],
  ['fontMono', '--chipper-font-mono'],
  ['focusRing', '--chipper-focus-ring'],
  ['popupShadow', '--chipper-popup-shadow'],
  ['transition', '--chipper-transition'],
];

/** Resolve a hue by role name, falling back to the theme's fallback hue. */
function resolveHue(theme: ChipperTheme, roleName: string): Hue | undefined {
  if (theme.hues[roleName]) return theme.hues[roleName];
  const fallbackName = theme.fallbackHue ?? Object.keys(theme.hues)[0];
  if (fallbackName) return theme.hues[fallbackName];
  return undefined;
}

/** Convert a hue to its CSS custom property entries for a given role name. */
function hueToProperties(roleName: string, hue: Hue): Array<[string, string]> {
  const prefix = `--chipper-color-${roleName}`;
  const entries: Array<[string, string]> = [
    [`${prefix}-text`, hue.text],
    [`${prefix}-bg`, hue.background],
    [`${prefix}-hover`, hue.hover],
  ];
  if (hue.glow) {
    entries.push([`${prefix}-glow`, hue.glow]);
  }
  return entries;
}

/**
 * Convert a complete theme to a flat CSS custom property map.
 * Useful for inspection, testing, or custom application logic.
 */
export function themeToProperties(
  theme: ChipperTheme,
  hueRoles?: string[],
): Record<string, string> {
  const properties: Record<string, string> = {};

  for (const [key, prop] of SURFACE_KEYS) {
    properties[prop] = theme.surface[key];
  }
  for (const [key, prop] of ACCENT_KEYS) {
    properties[prop] = theme.accent[key];
  }
  for (const [key, prop] of SEMANTIC_KEYS) {
    properties[prop] = theme.semantic[key];
  }
  for (const [key, prop] of STRUCTURE_KEYS) {
    properties[prop] = theme.structure[key];
  }

  // Emit tokens for all hues defined in the theme
  for (const [roleName, hue] of Object.entries(theme.hues)) {
    for (const [prop, value] of hueToProperties(roleName, hue)) {
      properties[prop] = value;
    }
  }

  // Emit fallback tokens for requested roles not in the theme
  if (hueRoles) {
    for (const roleName of hueRoles) {
      if (!(roleName in theme.hues)) {
        const fallbackHue = resolveHue(theme, roleName);
        if (fallbackHue) {
          for (const [prop, value] of hueToProperties(roleName, fallbackHue)) {
            properties[prop] = value;
          }
        }
      }
    }
  }

  return properties;
}

export interface ApplyThemeOptions {
  /** DOM element to apply tokens to. Defaults to document.documentElement. */
  container?: HTMLElement;
  /** Hue role names used by the consumer's palette. Enables fallback
      for roles not explicitly defined in the theme. */
  hueRoles?: string[];
}

/**
 * Apply a Chipper theme by setting CSS custom properties on a container.
 *
 * Clears the previous theme's tokens first, then applies the new theme.
 * Container defaults to `document.documentElement` (`:root`).
 */
export function applyTheme(
  theme: ChipperTheme,
  options?: ApplyThemeOptions,
): void {
  const container = options?.container ?? document.documentElement;

  // Clear previous theme's properties
  clearTheme(container);

  // Apply new theme
  const properties = themeToProperties(theme, options?.hueRoles);
  for (const [prop, value] of Object.entries(properties)) {
    container.style.setProperty(prop, value);
  }
}

/**
 * Clear all chipper theme overrides, restoring the SCSS cascade.
 *
 * Equivalent to switching back to the SCSS-compiled default theme (praxis)
 * without needing the praxis theme object.
 */
export function clearTheme(container?: HTMLElement): void {
  const target = container ?? document.documentElement;

  // Remove all chipper custom properties set as inline styles.
  // Walk the inline style and remove anything starting with --chipper-.
  const propsToRemove: string[] = [];
  for (let i = 0; i < target.style.length; i++) {
    const prop = target.style.item(i);
    if (prop && prop.startsWith('--chipper-')) {
      propsToRemove.push(prop);
    }
  }
  for (const prop of propsToRemove) {
    target.style.removeProperty(prop);
  }
}
