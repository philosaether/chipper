/**
 * useSentence — sentence-level state access.
 *
 * Returns the full sentence state, dispatch, definition, and resolved domains.
 * Used by components that need the big picture and by other hooks internally.
 */

import { useContext } from 'react';
import { SentenceContext } from './context';

export function useSentence() {
  const context = useContext(SentenceContext);
  if (!context) {
    throw new Error('useSentence must be used within a <SentenceProvider>.');
  }
  return {
    state: context.store.state,
    dispatch: context.dispatch,
    definition: context.definition,
    domains: context.store.domains,
  };
}
