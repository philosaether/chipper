/**
 * Shared keyword normalization and domain utilities.
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
  label?: string | ((context: Record<string, unknown>) => string);
  display?: string;
  partial?: boolean;
}

/** Normalize shorthand keyword configs into full Keyword<T> objects. */
export function normalizeKeywords<T>(configs: KeywordConfig<T>[]): Keyword<T>[] {
  return configs.map((config) => ({
    label: config.label ?? String(config.value),
    displayLabel: config.display,
    value: config.value,
    partial: config.partial,
  }));
}

/**
 * Build a value → display text map from normalized keywords.
 * Uses displayLabel if present, falls back to label.
 */
export function buildDisplayMap<T>(keywords: Keyword<T>[]): Map<T, string> {
  return new Map(keywords.map((k) => {
    const label = k.displayLabel ?? (typeof k.label === 'string' ? k.label : undefined);
    return label ? [k.value, label] as const : undefined;
  }).filter((entry): entry is [T, string] => entry !== undefined));
}

/**
 * Resolve the default value for a domain.
 *
 * Cascade: explicit default → deprecated defaultValue → placeholder-aware fallback.
 * When placeholder is set, defaults to fallbackEmpty (user must choose).
 * When no placeholder, defaults to first keyword if available.
 */
export function resolveDefault<T>(
  config: { default?: T; defaultValue?: T; placeholder?: string },
  keywords: Keyword<unknown>[],
  firstKeywordValue: T | undefined,
  fallbackEmpty: T,
): T {
  if (config.default !== undefined) return config.default;
  if (config.defaultValue !== undefined) return config.defaultValue;
  if (config.placeholder) return fallbackEmpty;
  return firstKeywordValue ?? fallbackEmpty;
}
