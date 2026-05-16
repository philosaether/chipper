/**
 * Pure enum domain — all values are keywords, no expression modes.
 *
 * The simplest archetype. The value space is fully defined by the
 * keyword list. Validate checks set membership; display returns the
 * keyword label.
 */

import type { Domain, Keyword, SentenceContext } from '../core/types';
import { createDomain } from './create-domain';
import { normalizeKeywords, type KeywordConfig } from './normalize-keywords';

/** Configuration for an enum domain. */
export interface EnumDomainConfig {
  /** Semantic color key (maps to CSS custom property --chip-color-{color}) */
  color: string;

  /** The complete set of allowed values */
  keywords: KeywordConfig<string>[] | Keyword<string>[];

  /** Default value. When omitted, uses first keyword's value or '' if no keywords. */
  default?: string;

  /** @deprecated Use `default` instead */
  defaultValue?: string;

  /** Text shown in the chip trigger when the value is invalid */
  placeholder?: string;

  /** Context keys this domain reads from ancestor producers */
  consumes?: string[];

  /** Context keys this domain writes for descendant consumers */
  produces?: string[];

  /** Reconfigure domain when ancestor context changes */
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}

/**
 * Create a pure enum domain.
 *
 * @example
 * ```typescript
 * const priority = enumDomain({
 *   color: 'priority',
 *   keywords: [
 *     { value: 'low' },
 *     { value: 'medium' },
 *     { value: 'high' },
 *   ],
 *   placeholder: 'a priority level',
 * });
 * ```
 */
export function enumDomain(config: EnumDomainConfig): Domain<string> {
  const keywords: Keyword<string>[] = normalizeKeywords(
    config.keywords as KeywordConfig<string>[],
  );

  const validValues = new Set<string>();
  const displayByValue = new Map<string, string>();
  for (const k of keywords) {
    validValues.add(k.value);
    displayByValue.set(k.value, k.displayLabel ?? k.label);
  }

  const defaultValue = config.default
    ?? config.defaultValue
    ?? (keywords.length > 0 ? keywords[0]!.value : '');

  return createDomain<string>({
    type: 'enum',
    color: config.color,
    keywords,
    defaultValue,
    placeholder: config.placeholder,
    validate: (value) => validValues.has(value),
    display: (value) => displayByValue.get(value) ?? String(value),
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
  });
}
