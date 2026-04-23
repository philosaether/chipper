/**
 * Palette creation and extension.
 *
 * The palette is the bridge between Chipper's generic machinery and
 * a consumer application's specific vocabulary. See chipper-architecture.md §3.
 */

import type { Palette } from '../core/types';

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
 * Extend an existing palette with additional domains and clause templates.
 * If no base palette is provided, extends the built-in chipperPalette.
 */
export function extendPalette(
  baseOrExtension: Palette | Partial<Palette>,
  extension?: Partial<Palette>,
): Palette {
  const base = extension !== undefined ? (baseOrExtension as Palette) : chipperPalette;
  const ext = extension !== undefined ? extension : (baseOrExtension as Partial<Palette>);

  return {
    domains: { ...base.domains, ...ext.domains },
    clauseTemplates: { ...base.clauseTemplates, ...ext.clauseTemplates },
  };
}
