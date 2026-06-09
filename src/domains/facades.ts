/**
 * Facade domain factories — sugar over keywordOrExpressionDomain.
 *
 * These hide KOE internals for the most common chip types. Consumers
 * define text inputs, number inputs, date pickers, and keyword lists
 * without thinking about expression modes or input types.
 *
 * See koe-facades.md.
 */

import type { Domain, SentenceContext } from '../core/types';
import type { KeywordGroupItem } from './normalize-keywords';
import {
  keywordOrExpressionDomain,
  textExpression,
  numericExpression,
  dateExpression,
} from './keyword-or-expression';

// ---------------------------------------------------------------------------
// textDomain
// ---------------------------------------------------------------------------

/** Configuration for a free-text domain. */
export interface TextDomainConfig {
  /** Semantic color key */
  color: string;
  /** Text shown in chip trigger when empty */
  placeholder?: string;
  /** Initial value (defaults to '' → shows placeholder) */
  default?: string;
  /** Character limit (default 140) */
  maxLength?: number;
  /** Render a textarea instead of a single-line input */
  multiline?: boolean;
  /** Custom validation beyond non-empty */
  validate?: (value: string) => boolean;
  /** Format value for chip trigger display */
  display?: (value: string) => string;
  /** Optional preset values as keyword pills. Accepts groups for visual grouping. */
  keywords?: KeywordGroupItem<string>[];
}

/**
 * Create a free-text domain. The simplest freeform chip.
 *
 * @example
 * ```typescript
 * const taskName = textDomain({
 *   color: 'rose',
 *   placeholder: 'a task name',
 * });
 * ```
 */
export function textDomain(config: TextDomainConfig): Domain<string> {
  return keywordOrExpressionDomain({
    color: config.color,
    placeholder: config.placeholder,
    default: config.default,
    keywords: config.keywords,
    expression: config.multiline
      ? { inputType: 'textarea' as const, placeholder: config.placeholder, maxLength: config.maxLength ?? 140, validate: config.validate, display: config.display }
      : textExpression({ maxLength: config.maxLength ?? 140, validate: config.validate, display: config.display }),
  });
}

// ---------------------------------------------------------------------------
// numberDomain
// ---------------------------------------------------------------------------

/** Configuration for a numeric domain. */
export interface NumberDomainConfig {
  /** Semantic color key */
  color: string;
  /** Text shown in chip trigger when empty */
  placeholder?: string;
  /** Initial value (defaults to '' → shows placeholder) */
  default?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment for +/- buttons (default 1) */
  step?: number;
  /** Text before the input (static or context-aware) */
  prefix?: string | ((ctx: SentenceContext) => string);
  /** Text after the input (static or context-aware) */
  suffix?: string | ((ctx: SentenceContext) => string);
  /** Custom validation beyond numeric check */
  validate?: (value: string) => boolean;
  /** Format value for chip trigger display */
  display?: (value: string) => string;
  /** Optional preset values as keyword pills. Accepts groups for visual grouping. */
  keywords?: KeywordGroupItem<string>[];
}

/**
 * Create a numeric domain with stepper UI.
 *
 * @example
 * ```typescript
 * const interval = numberDomain({
 *   color: 'copper',
 *   min: 1,
 *   max: 365,
 *   placeholder: 'an interval',
 * });
 * ```
 */
export function numberDomain(config: NumberDomainConfig): Domain<string> {
  return keywordOrExpressionDomain({
    color: config.color,
    placeholder: config.placeholder,
    default: config.default,
    keywords: config.keywords,
    expression: numericExpression({
      min: config.min,
      max: config.max,
      step: config.step,
      prefix: config.prefix,
      suffix: config.suffix,
      validate: config.validate,
      display: config.display,
    }),
  });
}

// ---------------------------------------------------------------------------
// dateDomain
// ---------------------------------------------------------------------------

/** Configuration for a calendar date domain. */
export interface DateDomainConfig {
  /** Semantic color key */
  color: string;
  /** Text shown in chip trigger when empty */
  placeholder?: string;
  /** Initial value (defaults to '' → shows placeholder) */
  default?: string;
  /** Custom validation beyond YYYY-MM-DD format */
  validate?: (value: string) => boolean;
  /** Format date for chip trigger display */
  display?: (value: string) => string;
  /** Optional preset values (e.g., "tomorrow", "next Monday"). Accepts groups for visual grouping. */
  keywords?: KeywordGroupItem<string>[];
}

/**
 * Create a calendar date picker domain.
 *
 * @example
 * ```typescript
 * const dueDate = dateDomain({
 *   color: 'sage',
 *   placeholder: 'a date',
 * });
 * ```
 */
export function dateDomain(config: DateDomainConfig): Domain<string> {
  return keywordOrExpressionDomain({
    color: config.color,
    placeholder: config.placeholder,
    default: config.default,
    keywords: config.keywords,
    expression: dateExpression({
      validate: config.validate,
      display: config.display,
    }),
  });
}

// ---------------------------------------------------------------------------
// keywordDomain
// ---------------------------------------------------------------------------

/** Configuration for a keywords-only domain. */
export interface KeywordDomainConfig {
  /** Semantic color key */
  color: string;
  /** The complete set of allowed values. Accepts groups for visual grouping. */
  keywords: KeywordGroupItem<string>[];
  /** Default value (defaults to first keyword value) */
  default?: string;
  /** Text shown in chip trigger when value is invalid */
  placeholder?: string;
}

/**
 * Create a keywords-only domain. Replaces enumDomain.
 *
 * @example
 * ```typescript
 * const priority = keywordDomain({
 *   color: 'rose',
 *   keywords: [
 *     { value: 'low' },
 *     { value: 'medium' },
 *     { value: 'high' },
 *   ],
 * });
 * ```
 */
export function keywordDomain(config: KeywordDomainConfig): Domain<string> {
  return keywordOrExpressionDomain({
    color: config.color,
    keywords: config.keywords,
    default: config.default,
    placeholder: config.placeholder,
  });
}
