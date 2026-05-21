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
import { normalizeKeywords, buildDisplayMap, resolveDefault, type KeywordConfig } from './normalize-keywords';

/** Configuration for a trigger keyword that enters expression mode. */
export interface ExpressionTrigger {
  /** Popup pill label (e.g., "custom interval") */
  label: string;
  /** Default value when entering expression mode (e.g., "2") */
  default: string;
}

/** Expression mode configuration for the text input. */
export interface ExpressionConfig {
  /** Input type — 'text', 'number' (stepper UI), or 'date' (calendar picker). Required. */
  inputType: 'text' | 'number' | 'date';

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

  /** Text shown before the input in the popup (e.g., "in"). Function receives sentence context. */
  prefix?: string | ((context: Record<string, unknown>) => string);

  /** Text shown after the input in the popup (e.g., "months"). Function receives sentence context. */
  suffix?: string | ((context: Record<string, unknown>) => string);

  /**
   * Keyword that enters expression mode when selected.
   * When absent, the expression input is always visible in the popup.
   * When present, the expression input is hidden until this trigger is selected.
   */
  trigger?: ExpressionTrigger;
}

/**
 * Create a text expression config.
 * Sugar for { inputType: 'text', ...options }.
 */
export function textExpression(
  options?: Omit<ExpressionConfig, 'inputType'>,
): ExpressionConfig {
  return { inputType: 'text', ...options };
}

/**
 * Create a numeric expression config.
 * Sugar for { inputType: 'number', ...options } with sensible defaults.
 */
export function numericExpression(
  options?: Omit<ExpressionConfig, 'inputType'>,
): ExpressionConfig {
  return {
    inputType: 'number',
    validate: (v) => { const n = Number(v); return !isNaN(n) && isFinite(n); },
    ...options,
  };
}

/**
 * Create a calendar date expression config.
 * Sugar for { inputType: 'date', ...options } with sensible defaults.
 * Values are YYYY-MM-DD strings (native date input format).
 */
export function dateExpression(
  options?: Omit<ExpressionConfig, 'inputType'>,
): ExpressionConfig {
  return {
    inputType: 'date',
    validate: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)),
    ...options,
  };
}

/** Configuration for a keyword-or-expression domain. */
export interface KeywordOrExpressionDomainConfig {
  /** Semantic color key */
  color: string;

  /** Preset values shown as keyword pills in the popup */
  keywords?: KeywordConfig<string>[] | Keyword<string>[];

  /** Expression mode configuration. Omit for keywords-only domains. */
  expression?: ExpressionConfig;

  /** Default value. When omitted, uses first keyword's value or '' if no keywords. */
  default?: string;

  /** @deprecated Use `default` instead */
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
 *     { value: '09:00', label: 'morning' },
 *     { value: '12:00', label: 'afternoon' },
 *     { value: '17:00', label: 'evening' },
 *   ],
 *   expression: textExpression({
 *     placeholder: 'a specific time (HH:MM)',
 *     validate: (v) => /^\d{2}:\d{2}$/.test(v),
 *   }),
 *   placeholder: 'a time',
 * });
 * ```
 */
export function keywordOrExpressionDomain(
  config: KeywordOrExpressionDomainConfig,
): Domain<string> {
  const keywords: Keyword<string>[] = normalizeKeywords(
    (config.keywords ?? []) as KeywordConfig<string>[],
  );

  const validKeywordValues = new Set<string>(keywords.map((k) => k.value));
  const displayByValue = buildDisplayMap(keywords);

  const expression = config.expression;
  const expressionValidate = expression?.validate ?? ((v: string) => v.length > 0);
  const expressionDisplay = expression?.display ?? ((v: string) => v);

  const validate = expression
    ? (value: string): boolean => validKeywordValues.has(value) || expressionValidate(value)
    : (value: string): boolean => validKeywordValues.has(value);

  const resolveAffix = (
    affix: string | ((ctx: Record<string, unknown>) => string) | undefined,
    ctx: Record<string, unknown>,
  ): string => {
    if (!affix) return '';
    return typeof affix === 'function' ? affix(ctx) : affix;
  };

  const display = (value: string, context?: Record<string, unknown>): string => {
    const staticLabel = displayByValue.get(value);
    if (staticLabel) return staticLabel;
    // Check for dynamic keyword labels (function labels excluded from static map)
    const dynamicKeyword = keywords.find(
      (k) => k.value === value && typeof k.label === 'function',
    );
    if (dynamicKeyword) return (dynamicKeyword.label as (ctx: Record<string, unknown>) => string)(context ?? {});
    // Expression value: wrap with prefix/suffix for chip trigger display
    const ctx = context ?? {};
    const prefix = resolveAffix(expression?.prefix, ctx);
    const suffix = resolveAffix(expression?.suffix, ctx);
    const core = expressionDisplay(value);
    return [prefix, core, suffix].filter(Boolean).join(' ');
  };

  const expressionModes: ExpressionMode<string>[] = [];

  if (expression) {
    expressionModes.push({
      id: expression.inputType,
      label: expression.placeholder ?? 'Type a value',
      degreesOfFreedom: 1,
      validate: expressionValidate,
      display: expressionDisplay,
      maxLength: expression.maxLength,
      inputType: expression.inputType,
      min: expression.min,
      max: expression.max,
      step: expression.step,
      prefix: expression.prefix,
      suffix: expression.suffix,
    });
  }

  const defaultValue = resolveDefault(config, keywords, keywords[0]?.value, '');

  const meta: Record<string, unknown> | undefined = expression?.trigger
    ? { trigger: expression.trigger }
    : undefined;

  return createDomain<string>({
    type: 'keyword-or-expression',
    color: config.color,
    keywords,
    expressionModes,
    defaultValue,
    placeholder: config.placeholder,
    validate,
    display,
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
    meta,
  });
}

/** Configuration for an expression-only domain (no keywords). */
export interface ExpressionDomainConfig {
  /** Semantic color key */
  color: string;

  /** Expression mode configuration */
  expression: ExpressionConfig;

  /** Default value. Empty string if omitted (invalid → placeholder). */
  default?: string;

  /** @deprecated Use `default` instead */
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
 *   expression: textExpression({
 *     placeholder: 'task name',
 *     maxLength: 200,
 *   }),
 *   placeholder: 'a new task',
 * });
 * ```
 */
export function expressionDomain(config: ExpressionDomainConfig): Domain<string> {
  return keywordOrExpressionDomain({ ...config, keywords: [] });
}
