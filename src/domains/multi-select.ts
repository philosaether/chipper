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

/** Configuration for a multi-select domain. */
export interface MultiSelectDomainConfig {
  /** Semantic color key */
  color: string;

  /** Available options (rendered as toggle pills in the popup) */
  options: Keyword<string>[];

  /**
   * Group keywords — shortcuts that set multiple options at once.
   * Selecting a keyword replaces the current selection entirely.
   * E.g., { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] }
   */
  keywords?: Keyword<string[]>[];

  /** Max selections (omit for unlimited) */
  maxSelections?: number;

  /**
   * Label used when count display kicks in (4+ selections).
   * E.g., "days" → "4 days", "instruments" → "5 instruments".
   * Defaults to "selected".
   */
  countLabel?: string;

  /** Default value — empty array if omitted (invalid → placeholder) */
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
  const validValues = new Set(config.options.map((o) => o.value));
  const labelByValue = new Map(config.options.map((o) => [o.value, o.label]));
  const maxSelections = config.maxSelections;

  const countLabel = config.countLabel ?? 'selected';

  const validate = (value: string[]): boolean => {
    if (value.length === 0) return false;
    if (maxSelections !== undefined && value.length > maxSelections) return false;
    return value.every((v) => validValues.has(v));
  };

  const groupKeywords = config.keywords ?? [];

  const display = (value: string[]): string => {
    if (value.length === 0) return '';

    // Check if selection matches any group keyword (implicit matching)
    const valueSet = new Set(value);
    for (const keyword of groupKeywords) {
      if (
        keyword.value.length === value.length &&
        keyword.value.every((v) => valueSet.has(v))
      ) {
        return keyword.label;
      }
    }

    if (value.length <= DISPLAY_LABEL_THRESHOLD) {
      return value.map((v) => labelByValue.get(v) ?? v).join(', ');
    }
    return `${value.length} ${countLabel}`;
  };

  return createDomain<string[]>({
    type: 'multi-select',
    color: config.color,
    keywords: config.keywords ?? [],
    defaultValue: config.defaultValue ?? [],
    placeholder: config.placeholder,
    validate,
    display,
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
    meta: {
      options: config.options,
      maxSelections: config.maxSelections,
    },
  });
}
