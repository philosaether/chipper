/**
 * Multi-select domain — toggle grid of options, group keyword shortcuts.
 *
 * The third archetype. Value is string[] — an ordered array of selected
 * option values. Covers tags, day-sets, and any multi-choice value space.
 *
 * Display uses a "3 then count" rule: up to 3 labels comma-joined,
 * then "{n} selected" at 4+.
 */

import type { Domain, Keyword, SentenceContext } from '../core/types';
import { createDomain } from './create-domain';
import {
  normalizeKeywords,
  normalizeKeywordGroups,
  buildDisplayMap,
  type KeywordConfig,
  type KeywordGroupItem,
} from './normalize-keywords';

/** Configuration for a multi-select domain. */
export interface MultiSelectDomainConfig {
  /** Semantic color key */
  color: string;

  /** Available options (rendered as toggle pills in the popup). Accepts groups for visual grouping. */
  options: KeywordGroupItem<string>[] | Keyword<string>[];

  /**
   * Group keywords — shortcuts that set multiple options at once.
   * Selecting a keyword replaces the current selection entirely.
   * E.g., { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] }
   */
  keywords?: KeywordConfig<string[]>[] | Keyword<string[]>[];

  /** Max selections (omit for unlimited) */
  maxSelections?: number;

  /**
   * Label used when count display kicks in (4+ selections).
   * E.g., "days" → "4 days", "instruments" → "5 instruments".
   * Defaults to "selected".
   */
  countLabel?: string;

  /** Default value — empty array if omitted (invalid → placeholder) */
  default?: string[];

  /** @deprecated Use `default` instead */
  defaultValue?: string[];

  /** Text shown in chip trigger when no options are selected */
  placeholder?: string;

  /** Context keys this domain reads from ancestor producers */
  consumes?: string[];

  /** Context keys this domain writes for descendant consumers */
  produces?: string[];

  /** Reconfigure domain when ancestor context changes */
  onContextChange?: (context: SentenceContext) => Partial<Domain<string[]>>;
}

/** Display threshold: labels up to this count, then "{n} selected" */
const DISPLAY_LABEL_THRESHOLD = 3;

/** Check if a selection matches a group keyword's value set (order-independent). */
export function selectionMatchesKeyword(
  selection: ReadonlySet<string>,
  selectionLength: number,
  keywordValues: readonly string[],
): boolean {
  return (
    keywordValues.length === selectionLength &&
    keywordValues.every((v) => selection.has(v))
  );
}

/**
 * Create a multi-select domain.
 *
 * @example
 * ```typescript
 * const daySet = multiSelectDomain({
 *   color: 'sage',
 *   options: [
 *     { label: 'Mon', value: 'mon' },
 *     { label: 'Tue', value: 'tue' },
 *     { label: 'Wed', value: 'wed' },
 *     // ...
 *   ],
 *   keywords: [
 *     { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] },
 *   ],
 *   placeholder: 'which days',
 * });
 * ```
 */
export function multiSelectDomain(config: MultiSelectDomainConfig): Domain<string[]> {
  const rawOptions = config.options as KeywordGroupItem<string>[];
  const { flat: options, groups: rawOptionGroups } = normalizeKeywordGroups(rawOptions);
  const optionGroups = rawOptionGroups.length > 1 || rawOptionGroups.some((g) => g.label || g.layout === 'grid' || g.prefix)
    ? rawOptionGroups : undefined;

  const groupKeywords = config.keywords
    ? normalizeKeywords(config.keywords as KeywordConfig<string[]>[])
    : [];

  const validValues = new Set(options.map((o) => o.value));
  const displayByValue = buildDisplayMap(options);
  const maxSelections = config.maxSelections;

  const countLabel = config.countLabel ?? 'selected';

  const validate = (value: string[]): boolean => {
    if (value.length === 0) return false;
    if (maxSelections !== undefined && value.length > maxSelections) return false;
    return value.every((v) => validValues.has(v));
  };

  const display = (value: string[]): string => {
    if (value.length === 0) return '';

    // Check if selection matches any group keyword (implicit matching)
    const valueSet = new Set(value);
    for (const keyword of groupKeywords) {
      if (selectionMatchesKeyword(valueSet, value.length, keyword.value)) {
        return keyword.displayLabel ?? (typeof keyword.label === 'string' ? keyword.label : String(keyword.value));
      }
    }

    if (value.length <= DISPLAY_LABEL_THRESHOLD) {
      return value.map((v) => displayByValue.get(v) ?? v).join(', ');
    }
    return `${value.length} ${countLabel}`;
  };

  const defaultValue = config.default ?? config.defaultValue ?? [];

  return createDomain<string[]>({
    type: 'multi-select',
    color: config.color,
    keywords: groupKeywords,
    defaultValue,
    placeholder: config.placeholder,
    validate,
    display,
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
    meta: {
      options,
      optionGroups: optionGroups ?? undefined,
      maxSelections: config.maxSelections,
    },
  });
}
