/**
 * SET_CHIP_VALUE action — updates a chip's value, revalidates, recomputes display.
 */

import type { ChipState, ClauseState } from '../state';
import type { SentenceStore } from '../store';
import { computeClauseValidity, computeDisplayValue, computeSentenceValidity } from '../initialize';

/** Set a chip's value. */
export interface SetChipValueAction {
  type: 'SET_CHIP_VALUE';
  clauseId: string;
  chipId: string;
  value: unknown;
}

/** Handle SET_CHIP_VALUE: update chip, cascade validity to clause and sentence. */
export function handleSetChipValue(
  store: SentenceStore,
  action: SetChipValueAction,
): SentenceStore {
  const { clauseId, chipId, value } = action;
  const domain = store.domains[chipId];
  const clause = store.state.clauses[clauseId];

  if (!domain) {
    throw new Error(`Domain not resolved for chip "${chipId}".`);
  }
  if (!clause) {
    throw new Error(`Clause "${clauseId}" not found in sentence state.`);
  }

  const isValid = domain.validate(value);

  const newChipState: ChipState = {
    value,
    displayValue: computeDisplayValue(domain, value, isValid),
    valid: isValid,
    dirty: true,
  };

  const newChips = { ...clause.chips, [chipId]: newChipState };

  const newClause: ClauseState = { ...clause, chips: newChips, valid: computeClauseValidity(newChips) };
  const newClauses: Record<string, ClauseState> = {
    ...store.state.clauses,
    [clauseId]: newClause,
  };

  return {
    ...store,
    state: {
      ...store.state,
      clauses: newClauses,
      valid: computeSentenceValidity(newClauses),
    },
  };
}
