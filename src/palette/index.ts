/**
 * Palette creation and extension.
 *
 * The palette is the bridge between Chipper's generic machinery and
 * a consumer application's specific vocabulary. See chipper-architecture.md §3.
 *
 * Consumer-facing API uses { chips, patterns }. Internal Palette type
 * uses { domains, clauseTemplates }. See builder-dx.md §6.
 */

import type { Domain, ClauseTemplate, Palette } from '../core/types';

/** Consumer-facing palette config. Maps to internal Palette shape. */
export interface PaletteConfig {
  /** Named chip domain configurations */
  chips?: Record<string, Domain>;
  /** Named clause patterns (reusable clause templates) */
  patterns?: Record<string, ClauseTemplate>;
}

/** The built-in default palette. Extended by consumers via extendPalette(). */
export const chipperPalette: Palette = {
  domains: {},
  clauseTemplates: {},
};

/**
 * Create a palette from scratch. Most consumers should use extendPalette() instead.
 */
export function createPalette(definition: Palette): Palette {
  return { ...definition };
}

/**
 * Extend an existing palette with additional chip domains and clause patterns.
 * If no base palette is provided, extends the built-in chipperPalette.
 */
export function extendPalette(
  baseOrConfig: Palette | PaletteConfig,
  config?: PaletteConfig,
): Palette {
  const base = config !== undefined ? (baseOrConfig as Palette) : chipperPalette;
  const ext = config !== undefined ? config : (baseOrConfig as PaletteConfig);

  return {
    domains: { ...base.domains, ...ext.chips },
    clauseTemplates: { ...base.clauseTemplates, ...ext.patterns },
  };
}
