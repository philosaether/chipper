/**
 * React context for a Chipper sentence instance.
 *
 * Carries the store, dispatch, definition, and popup state.
 * One context per SentenceProvider — multiple Chipper instances
 * on the same page get independent contexts.
 */

import { createContext } from 'react';
import type { SentenceStore } from '../core/store';
import type { SentenceAction } from '../core/reducer';
import type { SentenceDefinition } from '../core/types';

/** Which chip popup is currently open, or null if none. */
export interface PopupState {
  /** Currently open chip ID, or null */
  chipId: string | null;
  /** Clause containing the open chip, or null */
  clauseId: string | null;
  /** DOM element the popup positions relative to */
  anchorElement: HTMLElement | null;
}

/** Value carried by SentenceContext. */
export interface SentenceContextValue {
  store: SentenceStore;
  dispatch: React.Dispatch<SentenceAction>;
  definition: SentenceDefinition;
  popupState: PopupState;
  setPopupState: React.Dispatch<React.SetStateAction<PopupState>>;
}

export const SentenceContext = createContext<SentenceContextValue | null>(null);
