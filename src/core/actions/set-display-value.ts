/**
 * SET_DISPLAY_VALUE action — updates a display chip with a new value from its source.
 *
 * Handles static, derived, remote, and external display sources.
 * Updates value, displayValue, loading, error, and lastUpdated on ChipState.
 */

import type { SentenceStore } from '../store';
import { computeDisplayValue, computeClauseValidity, computeSentenceValidity } from '../initialize';

/** Update a display chip's value from its source. */
export interface SetDisplayValueAction {
  type: 'SET_DISPLAY_VALUE';
  chipId: string;
  value: unknown;
  loading?: boolean;
  error?: string;
}

/** Handle SET_DISPLAY_VALUE — write value + display state into the chip. */
export function handleSetDisplayValue(
  store: SentenceStore,
  action: SetDisplayValueAction,
): SentenceStore {
  const { chipId, value, loading, error } = action;
  const domain = store.domains[chipId];
  if (!domain) return store;

  // Find which clause owns this chip
  let targetClauseId: string | undefined;
  for (const clauseDef of store.definition.clauses) {
    if (clauseDef.chips.some((c) => c.id === chipId)) {
      targetClauseId = clauseDef.id;
      break;
    }
  }
  if (!targetClauseId) return store;

  const clauseState = store.state.clauses[targetClauseId];
  if (!clauseState) return store;

  const oldChipState = clauseState.chips[chipId];
  if (!oldChipState) return store;

  const isValid = loading ? oldChipState.valid : domain.validate(value);
  const displayValue = loading
    ? oldChipState.displayValue
    : computeDisplayValue(domain, value, isValid);

  const newChipState = {
    ...oldChipState,
    value: loading ? oldChipState.value : value,
    displayValue,
    valid: isValid,
    loading: loading ?? false,
    error: error ?? undefined,
    lastUpdated: (!loading && !error) ? Date.now() : oldChipState.lastUpdated,
  };

  const newChips = { ...clauseState.chips, [chipId]: newChipState };
  const newClauseState = {
    ...clauseState,
    chips: newChips,
    valid: computeClauseValidity(newChips, clauseState.visibleChips),
  };

  const newClauses = { ...store.state.clauses, [targetClauseId]: newClauseState };
  const newState = {
    ...store.state,
    clauses: newClauses,
    valid: computeSentenceValidity(newClauses),
  };

  return { ...store, state: newState };
}
