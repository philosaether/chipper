/**
 * SentenceProvider — wraps useReducer and popup state for a sentence instance.
 *
 * Components and hooks beneath this provider access sentence state via
 * useSentence, useChip, and usePopup.
 */

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { SentenceDefinition } from '../core/types';
import type { SentenceState } from '../core/state';
import { sentenceReducer } from '../core/reducer';
import { initializeSentenceState } from '../core/initialize';
import { SentenceContext, type PopupState } from './context';

export interface SentenceProviderProps {
  definition: SentenceDefinition;
  onChange?: (state: SentenceState) => void;
  children: React.ReactNode;
}

const closedPopup: PopupState = {
  chipId: null,
  clauseId: null,
  anchorElement: null,
};

export function SentenceProvider({ definition, onChange, children }: SentenceProviderProps) {
  const [store, dispatch] = useReducer(
    sentenceReducer,
    definition,
    initializeSentenceState,
  );

  const [popupState, setPopupState] = useState<PopupState>(closedPopup);

  // Ref-wrap onChange so identity changes don't re-fire the effect
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current?.(store.state);
  }, [store.state]);

  const contextValue = useMemo(
    () => ({ store, dispatch, definition, popupState, setPopupState }),
    [store, dispatch, definition, popupState, setPopupState],
  );

  return (
    <SentenceContext.Provider value={contextValue}>
      {children}
    </SentenceContext.Provider>
  );
}
