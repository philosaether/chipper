/**
 * SET_CHIP_VALUE action — updates a chip's value, revalidates, recomputes display.
 *
 * When the chip's clause produces context, triggers context propagation
 * to evaluate contingent clauses. See contingency-engine.md §4.
 */

import type { ChipState, ClauseState } from '../state';
import type { SentenceStore } from '../store';
import type { ExpressionTrigger } from '../../domains/keyword-or-expression';
import { buildContextFromChips, computeClauseValidity, computeDisplayValue, computeSentenceValidity, evaluateVisibleChips } from '../initialize';
import { evaluateContingency, buildClauseContext } from '../context-resolution';
import { TRIGGER_SENTINEL } from '../mode-switching';

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

  // Mode-switching: detect trigger sentinel and keyword exits
  const trigger = domain.meta?.trigger as ExpressionTrigger | undefined;
  let effectiveValue = value;
  let expressionMode = clause.chips[chipId]?.expressionMode;

  if (trigger) {
    if (value === TRIGGER_SENTINEL) {
      expressionMode = true;
      effectiveValue = trigger.default;
    } else if (expressionMode && domain.keywords.some((k) => k.value === value)) {
      // Selecting a regular keyword exits expression mode
      expressionMode = false;
    }
    // Stepper/expression value changes while in expression mode: no mode change
  }

  const isValid = domain.validate(effectiveValue);
  const clauseDef = store.definition.clauses.find((c) => c.id === clauseId);

  // Build clause context (ancestor + own productions) for display and segment visibility
  const pendingChips = { ...clause.chips, [chipId]: { ...clause.chips[chipId]!, value: effectiveValue } };
  const clauseContext = clauseDef
    ? buildClauseContext(clauseId, clauseDef, pendingChips, store.definition, store.state.contexts)
    : undefined;

  const newChipState: ChipState = {
    value: effectiveValue,
    displayValue: computeDisplayValue(domain, effectiveValue, isValid, clauseContext),
    valid: isValid,
    dirty: true,
    // false → undefined so the field is absent (not false) when not in expression mode
    expressionMode: expressionMode || undefined,
  };

  const newChips = { ...clause.chips, [chipId]: newChipState };

  // Re-evaluate segment visibility when the clause has chip-level predicates
  let visibleChips = clause.visibleChips;
  if (clauseDef) {
    const hasSegmentPredicates = clauseDef.segments.some(
      (s) => s.type === 'chip' && s.present,
    );
    if (hasSegmentPredicates) {
      const fullContext = clauseContext ?? buildClauseContext(
        clauseId, clauseDef, newChips, store.definition, store.state.contexts,
      );
      visibleChips = evaluateVisibleChips(clauseDef.segments, fullContext);
    }
  }

  const newClause: ClauseState = {
    ...clause,
    chips: newChips,
    valid: computeClauseValidity(newChips, visibleChips),
    visibleChips,
  };
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
  if (clauseDef?.contextProductions) {
    const contextValues = buildContextFromChips(clauseDef.contextProductions, newClause);
    return evaluateContingency(updatedStore, clauseId, contextValues);
  }

  return updatedStore;
}
