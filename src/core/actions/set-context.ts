/**
 * SET_CONTEXT action — updates scoped context and evaluates contingent clauses.
 *
 * Delegates to the contingency engine's evaluateContingency function
 * for presence evaluation, domain reconfiguration, and cascade.
 * See contingency-engine.md §3.
 */

import type { SentenceContext } from '../types';
import type { SentenceStore } from '../store';
import { evaluateContingency } from '../context-resolution';

/** Update scoped context values for a clause. */
export interface SetContextAction {
  type: 'SET_CONTEXT';
  clauseId: string;
  values: SentenceContext;
}

/** Handle SET_CONTEXT: evaluate contingency and cascade. */
export function handleSetContext(
  store: SentenceStore,
  action: SetContextAction,
): SentenceStore {
  return evaluateContingency(store, action.clauseId, action.values);
}
