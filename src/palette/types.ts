/**
 * Palette type re-exports.
 *
 * The canonical Palette and ClauseTemplate types live in core/types.ts.
 * This file exists so palette/ has its own types module for future
 * palette-specific types that don't belong in core.
 */

export type { Palette, ClauseTemplate } from '../core/types';
