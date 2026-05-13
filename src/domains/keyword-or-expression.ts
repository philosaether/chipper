/**
 * Keyword-or-expression domain — keywords for common values, text input
 * for everything else.
 *
 * The second archetype. Covers time, due, task name, description, number,
 * start, collate name — any domain where the value space is "a few presets
 * plus freeform."
 *
 * Also exports expressionDomain as a convenience alias for expression-only
 * domains (no keywords).
 */

import type { Domain, ExpressionMode, Keyword, SentenceContext } from '../core/types';
import { createDomain } from './create-domain';

/** Expression mode configuration for the text input. */
export interface ExpressionConfig {
  /** Input type — 'text' (default) or 'number' (stepper UI) */
  inputType?: 'text' | 'number';

  /** Placeholder text for the input field */
  placeholder?: string;

  /** Maximum character length (omit for unlimited, text only) */
  maxLength?: number;

  /** Minimum value (number inputs only) */
  min?: number;

  /** Maximum value (number inputs only) */
  max?: number;

  /** Step increment for +/- buttons (number inputs only, default 1) */
  step?: number;

  /** Validate typed input (beyond non-empty). Return true if valid. */
  validate?: (value: string) => boolean;

  /** Format the value for chip trigger display (default: identity) */
  display?: (value: string) => string;
}

/** Configuration for a keyword-or-expression domain. */
export interface KeywordOrExpressionDomainConfig {
  /** Semantic color key */
  color: string;

  /** Preset values shown as keyword pills in the popup */
  keywords?: Keyword<string>[];

  /** Expression mode configuration */
  expression: ExpressionConfig;

  /** Default value. Empty string if omitted (invalid → placeholder). */
  defaultValue?: string;

  /** Text shown in chip trigger when value is invalid */
  placeholder?: string;

  /** Context keys this domain reads from ancestor producers */
  consumes?: string[];

  /** Context keys this domain writes for descendant consumers */
  produces?: string[];

  /** Reconfigure domain when ancestor context changes */
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}

/**
 * Create a keyword-or-expression domain.
 *
 * @example
 * ```typescript
 * const timeOfDay = keywordOrExpressionDomain({
 *   color: 'copper',
 *   keywords: [
 *     { label: 'morning', value: '09:00' },
 *     { label: 'afternoon', value: '12:00' },
 *     { label: 'evening', value: '17:00' },
 *   ],
 *   expression: {
 *     placeholder: 'a specific time (HH:MM)',
 *     validate: (v) => /^\d{2}:\d{2}$/.test(v),
 *   },
 *   placeholder: 'a time',
 * });
 * ```
 */
export function keywordOrExpressionDomain(
  config: KeywordOrExpressionDomainConfig,
): Domain<string> {
  const keywords = config.keywords ?? [];
  const validKeywordValues = new Set<string>(keywords.map((k) => k.value));
  const labelByValue = new Map<string, string>(
    keywords.map((k) => [k.value, k.label]),
  );

  const expressionValidate = config.expression.validate ?? ((v: string) => v.length > 0);
  const expressionDisplay = config.expression.display ?? ((v: string) => v);

  const validate = (value: string): boolean =>
    validKeywordValues.has(value) || expressionValidate(value);

  const display = (value: string): string =>
    labelByValue.get(value) ?? expressionDisplay(value);

  const inputType = config.expression.inputType ?? 'text';

  const expressionMode: ExpressionMode<string> = {
    id: inputType,
    label: config.expression.placeholder ?? 'Type a value',
    degreesOfFreedom: 1,
    validate: expressionValidate,
    display: expressionDisplay,
    maxLength: config.expression.maxLength,
    inputType,
    min: config.expression.min,
    max: config.expression.max,
    step: config.expression.step,
  };

  return createDomain<string>({
    type: 'keyword-or-expression',
    color: config.color,
    keywords,
    expressionModes: [expressionMode],
    defaultValue: config.defaultValue ?? '',
    placeholder: config.placeholder,
    validate,
    display,
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
  });
}

/** Configuration for an expression-only domain (no keywords). */
export interface ExpressionDomainConfig {
  /** Semantic color key */
  color: string;

  /** Expression mode configuration */
  expression: ExpressionConfig;

  /** Default value. Empty string if omitted (invalid → placeholder). */
  defaultValue?: string;

  /** Text shown in chip trigger when value is invalid */
  placeholder?: string;

  /** Context keys this domain reads from ancestor producers */
  consumes?: string[];

  /** Context keys this domain writes for descendant consumers */
  produces?: string[];

  /** Reconfigure domain when ancestor context changes */
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}

/**
 * Create an expression-only domain (no keywords).
 *
 * Convenience alias for keywordOrExpressionDomain with empty keywords.
 * Use this for free-text inputs: task names, descriptions, custom values.
 *
 * @example
 * ```typescript
 * const taskName = expressionDomain({
 *   color: 'rose',
 *   expression: {
 *     placeholder: 'task name',
 *     maxLength: 200,
 *   },
 *   placeholder: 'a new task',
 * });
 * ```
 */
export function expressionDomain(config: ExpressionDomainConfig): Domain<string> {
  return keywordOrExpressionDomain({ ...config, keywords: [] });
}
