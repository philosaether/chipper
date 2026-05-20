/**
 * Resolve a keyword's display label, handling both static strings
 * and dynamic context functions.
 */

import type { Keyword, SentenceContext } from './types';

export function resolveKeywordLabel(
  keyword: Keyword,
  context?: SentenceContext,
): string {
  if (typeof keyword.label === 'function') {
    return keyword.label(context ?? {});
  }
  return keyword.label;
}
