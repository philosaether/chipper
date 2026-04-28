/**
 * TOGGLE_CLAUSE action — activates or deactivates an optional clause.
 *
 * Stub — handler not yet implemented.
 */

import type { SentenceStore } from '../store';

/** Toggle an optional clause's active state. */
export interface ToggleClauseAction {
  type: 'TOGGLE_CLAUSE';
  clauseId: string;
}

/** Handle TOGGLE_CLAUSE. Stub — returns store unchanged. */
export function handleToggleClause(
  store: SentenceStore,
  _action: ToggleClauseAction,
): SentenceStore {
  return store;
}
