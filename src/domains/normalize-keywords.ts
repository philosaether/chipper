/**
 * Shared keyword normalization and domain utilities.
 *
 * Consumers can provide keyword shorthand:
 *   { value: 'daily' }                          → label='daily', displayLabel=undefined
 *   { value: 'daily', label: 'day' }            → label='day', displayLabel=undefined
 *   { value: 'daily', label: 'day', display: 'day of the week' }
 *                                                → label='day', displayLabel='day of the week'
 *
 * Grouping (keyword-grouping.md):
 *   Keywords arrays accept KeywordGroup objects alongside plain configs.
 *   Groups carry label, layout, columns, prefix. Ungrouped keywords
 *   collect into one implicit group at the top.
 *
 * See builder-dx.md §4, keyword-grouping.md.
 */

import type { Keyword } from '../core/types';

/** Shorthand keyword config accepted by domain factories. */
export interface KeywordConfig<T = string> {
  value: T;
  label?: string | ((context: Record<string, unknown>) => string);
  display?: string;
  partial?: boolean;
}

/** A named group of keywords rendered as a visual section in the popup. */
export interface KeywordGroup<T = string> {
  /** Display label rendered above the keywords (omit for unlabeled group) */
  label?: string;

  /** Keywords in this group */
  keywords: KeywordConfig<T>[];

  /** Layout mode: 'flow' (default flex-wrap) or 'grid' (CSS grid) */
  layout?: 'flow' | 'grid';

  /** Grid column count (required when layout is 'grid') */
  columns?: number;

  /** Text rendered before the keyword pills (e.g., "the") */
  prefix?: string;
}

/** A keyword config or a group of keyword configs. */
export type KeywordGroupItem<T = string> = KeywordConfig<T> | KeywordGroup<T>;

/** Normalized group ready for popup rendering. */
export interface NormalizedKeywordGroup<T = string> {
  label?: string;
  layout: 'flow' | 'grid';
  columns?: number;
  prefix?: string;
  keywords: Keyword<T>[];
}

/** Type guard: is this item a KeywordGroup (has a `keywords` array)? */
export function isKeywordGroup<T>(item: KeywordGroupItem<T>): item is KeywordGroup<T> {
  return 'keywords' in item && Array.isArray((item as KeywordGroup<T>).keywords);
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
 * Normalize a mixed keywords array into grouped form.
 *
 * Returns both a flat keyword list (for validation, display, keyboard nav)
 * and a grouped list (for popup rendering).
 *
 * Ungrouped KeywordConfig items are collected into a single implicit group
 * placed before any explicit groups. If all items are ungrouped, the result
 * is a single group with default config.
 */
export function normalizeKeywordGroups<T>(
  items: KeywordGroupItem<T>[],
): { flat: Keyword<T>[]; groups: NormalizedKeywordGroup<T>[] } {
  const ungrouped: KeywordConfig<T>[] = [];
  const explicitGroups: KeywordGroup<T>[] = [];

  for (const item of items) {
    if (isKeywordGroup(item)) {
      explicitGroups.push(item);
    } else {
      ungrouped.push(item);
    }
  }

  const groups: NormalizedKeywordGroup<T>[] = [];

  if (ungrouped.length > 0) {
    groups.push({
      layout: 'flow',
      keywords: normalizeKeywords(ungrouped),
    });
  }

  for (const group of explicitGroups) {
    groups.push({
      label: group.label,
      layout: group.layout ?? 'flow',
      columns: group.columns,
      prefix: group.prefix,
      keywords: normalizeKeywords(group.keywords),
    });
  }

  const flat = groups.flatMap((g) => g.keywords);

  return { flat, groups };
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
