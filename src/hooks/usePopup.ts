/**
 * usePopup — singleton popup management.
 *
 * Only one chip popup can be open at a time per sentence.
 * Opening a new popup closes the previous one automatically.
 */

import { useCallback, useContext } from 'react';
import { SentenceContext } from './context';

export function usePopup() {
  const context = useContext(SentenceContext);
  if (!context) {
    throw new Error('usePopup must be used within a <SentenceProvider>.');
  }

  const { popupState, setPopupState } = context;

  const open = useCallback(
    (clauseId: string, chipId: string, anchorElement: HTMLElement) => {
      setPopupState({ chipId, clauseId, anchorElement });
    },
    [setPopupState],
  );

  const close = useCallback(() => {
    setPopupState({ chipId: null, clauseId: null, anchorElement: null });
  }, [setPopupState]);

  const isOpen = useCallback(
    (chipId: string) => popupState.chipId === chipId,
    [popupState.chipId],
  );

  return { popup: popupState, open, close, isOpen };
}
