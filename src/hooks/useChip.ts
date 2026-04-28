/**
 * useChip — chip-level state access + setValue dispatch.
 *
 * Every Chip component calls this. Returns the chip's current state,
 * its domain (for popup rendering), and a setValue callback that
 * dispatches SET_CHIP_VALUE.
 */

import { useCallback } from 'react';
import { useSentence } from './useSentence';

export function useChip(clauseId: string, chipId: string) {
  const { state, dispatch, definition, domains } = useSentence();

  const chipState = state.clauses[clauseId]?.chips[chipId];
  if (!chipState) {
    throw new Error(`Chip "${chipId}" not found in clause "${clauseId}".`);
  }

  const domain = domains[chipId];
  if (!domain) {
    throw new Error(`Domain not resolved for chip "${chipId}".`);
  }

  const chipDefinition = definition.clauses
    .find((c) => c.id === clauseId)
    ?.chips.find((ch) => ch.id === chipId);
  if (!chipDefinition) {
    throw new Error(`Chip definition "${chipId}" not found in clause "${clauseId}".`);
  }

  const setValue = useCallback(
    (value: unknown) => {
      dispatch({ type: 'SET_CHIP_VALUE', clauseId, chipId, value });
    },
    [dispatch, clauseId, chipId],
  );

  return {
    ...chipState,
    domain,
    chipDefinition,
    setValue,
  };
}
