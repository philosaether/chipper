/**
 * SET_CHIP_VALUE action — updates a chip's value, revalidates, recomputes display.
 *
 * When the chip's clause produces context, triggers context propagation
 * to evaluate contingent clauses. See contingency-engine.md §4.
 */

import type { ChipState, ClauseState } from '../state';
import type { SentenceStore } from '../store';
import { buildContextFromChips, computeClauseValidity, computeDisplayValue, computeSentenceValidity } from '../initialize';
import { evaluateContingency } from '../context-resolution';

/** Set a chip's value. */
export interface SetChipValueAction {
  type: 'SET_CHIP_VALUE';
  clauseId: string;
  chipId: string;
  value: unknown;
}

/** Handle SET_CHIP_VALUE: update chip, cascade validity, propagate context. */
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

  const updatedStore: SentenceStore = {
    ...store,
    state: {
      ...store.state,
      clauses: newClauses,
      valid: computeSentenceValidity(newClauses),
    },
  };

  // Check if this clause produces context — if so, propagate
  const clauseDef = store.definition.clauses.find((c) => c.id === clauseId);
  if (clauseDef?.contextProductions) {
    const contextValues = buildContextFromChips(clauseDef.contextProductions, newClause);
    return evaluateContingency(updatedStore, clauseId, contextValues);
  }

  return updatedStore;
}
