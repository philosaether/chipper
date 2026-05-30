/**
 * Predicate helpers — factories that return context predicates for use
 * with `present`, `contingentOn`, and `.punc({ present })`.
 */

import type { SentenceContext } from '../core/types';

/**
 * True when the context value for `key` is a numeric string.
 *
 * Usage: `.chip('unit', 'timeUnit', { present: isNumeric('measure') })`
 */
export function isNumeric(key: string): (context: SentenceContext) => boolean {
  return (context) => {
    const value = context[key];
    return value !== undefined && value !== '' && !isNaN(Number(value));
  };
}

/**
 * True when the context value for `key` is one of the given values.
 *
 * Usage: `.punc({ present: isOneOf('measure', 'daily', 'weekday', 'weekend') })`
 */
export function isOneOf(key: string, ...values: string[]): (context: SentenceContext) => boolean {
  const valueSet = new Set(values);
  return (context) => valueSet.has(context[key] as string);
}
