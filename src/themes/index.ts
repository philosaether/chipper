/**
 * Chipper themes — runtime theme switching and built-in themes.
 *
 * Entry point for `chipper/themes` package export.
 */

// Types
export type { ChipperTheme, Hue } from './types';

// Helpers
export { createHue } from './create-hue';

// Runtime API
export { applyTheme, clearTheme, themeToProperties } from './apply-theme';
export type { ApplyThemeOptions } from './apply-theme';

// Built-in themes
export { praxisTheme } from './praxis';
export { midnightTheme } from './midnight';
export { terminalTheme } from './terminal';
