/**
 * SET_CONTEXT action — updates scoped context from a clause's productions.
 *
 * Stub — handler not yet implemented.
 */

import type { SentenceContext } from '../types';
import type { SentenceStore } from '../store';

/** Update scoped context values for a clause. */
export interface SetContextAction {
  type: 'SET_CONTEXT';
  clauseId: string;
  values: SentenceContext;
}

/** Handle SET_CONTEXT. Stub — returns store unchanged. */
export function handleSetContext(
  store: SentenceStore,
  _action: SetContextAction,
): SentenceStore {
  return store;
}
