/**
 * TOGGLE_CLAUSE action — activates or deactivates an optional clause.
 *
 * Only affects user-controlled activation, never engine-controlled presence.
 * See contingency-engine.md §2.
 */

import type { ClauseState } from '../state';
import type { SentenceStore } from '../store';
import { computeSentenceValidity } from '../initialize';

/** Toggle an optional clause's active state. */
export interface ToggleClauseAction {
  type: 'TOGGLE_CLAUSE';
  clauseId: string;
}

/** Handle TOGGLE_CLAUSE: flip active, cascade validity. */
export function handleToggleClause(
  store: SentenceStore,
  action: ToggleClauseAction,
): SentenceStore {
  const { clauseId } = action;
  const clause = store.state.clauses[clauseId];

  if (!clause) {
    throw new Error(`Clause "${clauseId}" not found in sentence state.`);
  }

  const newClause: ClauseState = { ...clause, active: !clause.active };
  const newClauses = { ...store.state.clauses, [clauseId]: newClause };

  return {
    ...store,
    state: {
      ...store.state,
      clauses: newClauses,
      valid: computeSentenceValidity(newClauses),
    },
  };
}
