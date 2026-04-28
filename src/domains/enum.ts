/**
 * Pure enum domain — all values are keywords, no expression modes.
 *
 * The simplest archetype. The value space is fully defined by the
 * keyword list. Validate checks set membership; display returns the
 * keyword label.
 */

import type { Domain, Keyword, SentenceContext } from '../core/types';
import { createDomain } from './create-domain';

/** Configuration for an enum domain. */
export interface EnumDomainConfig {
  /** Semantic color key (maps to CSS custom property --chip-color-{color}) */
  color: string;

  /** The complete set of allowed values */
  keywords: Keyword<string>[];

  /**
   * Default value. If omitted, defaults to empty string (invalid → placeholder).
   * If provided, should be a value from the keyword list.
   */
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
 *     { label: 'low', value: 'low' },
 *     { label: 'medium', value: 'medium' },
 *     { label: 'high', value: 'high' },
 *   ],
 *   placeholder: 'a priority level',
 * });
 * ```
 */
export function enumDomain(config: EnumDomainConfig): Domain<string> {
  const validValues = new Set<string>();
  const labelByValue = new Map<string, string>();
  for (const k of config.keywords) {
    validValues.add(k.value);
    labelByValue.set(k.value, k.label);
  }

  return createDomain<string>({
    type: 'enum',
    color: config.color,
    keywords: config.keywords,
    defaultValue: config.defaultValue ?? '',
    placeholder: config.placeholder,
    validate: (value) => validValues.has(value),
    display: (value) => labelByValue.get(value) ?? String(value),
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
  });
}
