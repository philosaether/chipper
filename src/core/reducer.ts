/**
 * Sentence reducer — pure state transitions for a Chipper sentence.
 *
 * The reducer operates on SentenceStore (state + resolved domains).
 * Each action type is handled by its own file under actions/.
 */

import type { SentenceStore } from './store';
import { handleSetChipValue, type SetChipValueAction } from './actions/set-chip-value';
import { handleToggleClause, type ToggleClauseAction } from './actions/toggle-clause';
import { handleSetContext, type SetContextAction } from './actions/set-context';
import { handleSetDisplayValue, type SetDisplayValueAction } from './actions/set-display-value';

/** Union of all sentence actions. */
export type SentenceAction =
  | SetChipValueAction
  | ToggleClauseAction
  | SetContextAction
  | SetDisplayValueAction;

/** Reduce a sentence action into a new store. */
export function sentenceReducer(
  store: SentenceStore,
  action: SentenceAction,
): SentenceStore {
  switch (action.type) {
    case 'SET_CHIP_VALUE':
      return handleSetChipValue(store, action);
    case 'TOGGLE_CLAUSE':
      return handleToggleClause(store, action);
    case 'SET_CONTEXT':
      return handleSetContext(store, action);
    case 'SET_DISPLAY_VALUE':
      return handleSetDisplayValue(store, action);
  }
}
