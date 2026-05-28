/**
 * useDisplaySource — manages display chip value resolution.
 *
 * Handles all four source strategies:
 * - static: no-op (value set during initialization)
 * - derived: recomputes on sentence state changes, memoized
 * - remote: fetches from URL, optional polling
 * - external: subscribes to consumer-managed data stream
 */

import { useEffect, useRef } from 'react';
import type { ChipDefinition, ClauseDefinition } from '../core/types';
import type { SentenceState, ContextScope } from '../core/state';
import type { SentenceAction } from '../core/reducer';
import { buildClauseContext } from '../core/context-resolution';

type Dispatch = (action: SentenceAction) => void;

export function useDisplaySource(
  chipDefinition: ChipDefinition,
  clauseId: string,
  state: SentenceState,
  clauseById: Map<string, ClauseDefinition>,
  dispatch: Dispatch,
): void {
  const mode = chipDefinition.mode;
  if (mode.type !== 'display') return;

  const source = mode.source;
  const chipId = chipDefinition.id;

  // Track previous derived value to avoid dispatch loops
  const prevDerivedRef = useRef<unknown>(undefined);

  // Derived source: recompute on state change, skip if unchanged
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (source.type !== 'derived') return;
    const clauseDef = clauseById.get(clauseId);
    const clauseState = state.clauses[clauseId];
    const context = clauseDef && clauseState
      ? buildClauseContext(clauseId, clauseDef, clauseState.chips, clauseById, state.contexts)
      : {};
    const newValue = source.compute(context, state);
    if (Object.is(newValue, prevDerivedRef.current)) return;
    prevDerivedRef.current = newValue;
    dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value: newValue });
  }, [source, state, dispatch, chipId, clauseId, clauseById]);

  // Remote source: fetch + optional polling
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (source.type !== 'remote') return;
    let active = true;

    const fetchValue = async () => {
      dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value: undefined, loading: true });
      try {
        const response = await fetch(source.url);
        const data = await response.json();
        const value = source.extract(data);
        if (active) dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value });
      } catch (e) {
        if (active) dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value: undefined, error: String(e) });
      }
    };

    fetchValue();
    const intervalId = source.interval ? setInterval(fetchValue, source.interval) : undefined;
    return () => { active = false; if (intervalId) clearInterval(intervalId); };
  }, [source, chipId, dispatch]);

  // External source: subscribe
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (source.type !== 'external') return;
    const unsubscribe = source.subscribe((value: unknown) => {
      dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value });
    });
    return unsubscribe;
  }, [source, chipId, dispatch]);
}
