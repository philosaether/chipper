/**
 * Shared keyword normalization for domain factories.
 *
 * Consumers can provide keyword shorthand:
 *   { value: 'daily' }                          → label='daily', displayLabel=undefined
 *   { value: 'daily', label: 'day' }            → label='day', displayLabel=undefined
 *   { value: 'daily', label: 'day', display: 'day of the week' }
 *                                                → label='day', displayLabel='day of the week'
 *
 * See builder-dx.md §4.
 */

import type { Keyword } from '../core/types';

/** Shorthand keyword config accepted by domain factories. */
export interface KeywordConfig<T = string> {
  value: T;
  label?: string;
  display?: string;
  partial?: boolean;
}

/** Normalize shorthand keyword configs into full Keyword<T> objects. */
export function normalizeKeywords<T>(configs: KeywordConfig<T>[]): Keyword<T>[] {
  return configs.map((config) => {
    const label = config.label ?? String(config.value);
    return {
      label,
      displayLabel: config.display,
      value: config.value,
      partial: config.partial,
    };
  });
}
